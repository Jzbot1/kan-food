import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, PaymentStatus, WalletType, TransactionType } from '@prisma/client';
import { OrderGateway } from '../notifications/order.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private orderGateway: OrderGateway
  ) {}

  async createOrder(customerId: string, restaurantId: string, data: any) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { wallet: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (!restaurant.isApproved) throw new BadRequestException('Restaurant is not active');

    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { wallet: true },
    });
    if (!customerProfile) throw new NotFoundException('Customer profile not found');

    const totalAmount = data.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) + data.deliveryFee + data.tax - data.discount;

    // Check wallet balance if payment method is wallet
    if (data.paymentMethod === 'WALLET') {
      if (customerProfile.wallet.balance < totalAmount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Deduct customer wallet
      await this.prisma.$transaction([
        this.prisma.wallet.update({
          where: { id: customerProfile.walletId },
          data: { balance: { decrement: totalAmount } },
        }),
        this.prisma.transaction.create({
          data: {
            walletId: customerProfile.walletId,
            amount: totalAmount,
            type: TransactionType.DEBIT,
            description: `Payment for order at ${restaurant.name}`,
          },
        }),
      ]);
    }

    // Generate random OTP code for delivery validation
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const order = await this.prisma.order.create({
      data: {
        customerId,
        restaurantId,
        totalAmount,
        deliveryFee: data.deliveryFee,
        tax: data.tax,
        discount: data.discount,
        commission: (totalAmount - data.deliveryFee) * (restaurant.commissionRate / 100),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'WALLET' ? PaymentStatus.PAID : PaymentStatus.PENDING,
        otp,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        items: {
          create: data.items.map((item: any) => ({
            foodId: item.foodId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variants: item.variants || [],
            addons: item.addons || [],
          })),
        },
      },
      include: {
        items: true,
        customer: { include: { user: true } },
      },
    });

    // Notify restaurant dashboard via socket
    this.orderGateway.notifyRestaurant(restaurantId, 'new_order', order);
    return order;
  }

  async acceptOrder(orderId: string, restaurantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) throw new BadRequestException('Unauthorized for this restaurant');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('Order status must be PENDING');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ACCEPTED },
    });

    // Notify Customer
    this.orderGateway.notifyCustomer(order.customer.userId, 'order_accepted', updatedOrder);
    return updatedOrder;
  }

  async startPreparing(orderId: string, restaurantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) throw new BadRequestException('Unauthorized for this restaurant');
    if (order.status !== OrderStatus.ACCEPTED) throw new BadRequestException('Order must be accepted first');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PREPARING },
    });

    this.orderGateway.notifyCustomer(order.customer.userId, 'order_preparing', updatedOrder);
    return updatedOrder;
  }

  async markReady(orderId: string, restaurantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, restaurant: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) throw new BadRequestException('Unauthorized for this restaurant');
    if (order.status !== OrderStatus.PREPARING) throw new BadRequestException('Order must be preparing');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.READY },
    });

    this.orderGateway.notifyCustomer(order.customer.userId, 'order_ready', updatedOrder);

    // Trigger driver dispatching algorithm
    this.dispatchOrderToDrivers(order);

    return updatedOrder;
  }

  // Live matching logic
  private async dispatchOrderToDrivers(order: any) {
    // Find nearby online driver within restaurant delivery radius
    const nearbyDrivers = await this.prisma.deliveryPartner.findMany({
      where: {
        isOnline: true,
        isApproved: true,
        // In PostgreSQL we'd use PostGIS distance, here is raw coordinate filtering
        currentLat: {
          gte: order.restaurant.latitude - 0.05,
          lte: order.restaurant.latitude + 0.05,
        },
        currentLng: {
          gte: order.restaurant.longitude - 0.05,
          lte: order.restaurant.longitude + 0.05,
        },
      },
      include: { user: true },
    });

    // Notify drivers in sequence or dispatch request via socket
    for (const driver of nearbyDrivers) {
      this.orderGateway.sendDeliveryRequest(driver.id, {
        orderId: order.id,
        restaurantName: order.restaurant.name,
        restaurantAddress: order.restaurant.address,
        deliveryAddress: order.deliveryAddress,
        payout: order.deliveryFee * 0.8, // 80% delivery fee to driver
      });
    }
  }

  async driverAcceptOrder(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.READY) throw new BadRequestException('Order is no longer available');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PICKED_UP,
        driverId,
      },
    });

    // Notify Customer and Restaurant
    this.orderGateway.notifyCustomer(order.customer.userId, 'driver_assigned', {
      orderId,
      driverId,
    });
    this.orderGateway.notifyRestaurant(order.restaurantId, 'driver_assigned', {
      orderId,
      driverId,
    });

    return updatedOrder;
  }

  async completeDelivery(orderId: string, driverId: string, enteredOtp: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { wallet: true } },
        restaurant: { include: { wallet: true } },
        driver: { include: { wallet: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.driverId !== driverId) throw new BadRequestException('Unauthorized driver');
    if (order.otp !== enteredOtp) throw new BadRequestException('Invalid delivery OTP');
    if (order.status !== OrderStatus.PICKED_UP) throw new BadRequestException('Order not picked up');

    // Calculations
    const driverPayout = order.deliveryFee * 0.8;
    const platformCommission = order.commission;
    const restaurantPayout = order.totalAmount - order.deliveryFee - platformCommission;

    await this.prisma.$transaction([
      // Update Order Status
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
        },
      }),

      // Credit Restaurant Wallet
      this.prisma.wallet.update({
        where: { id: order.restaurant.walletId },
        data: { balance: { increment: restaurantPayout } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: order.restaurant.walletId,
          amount: restaurantPayout,
          type: TransactionType.CREDIT,
          description: `Payout for completed order ${order.id} minus commission`,
          referenceId: order.id,
        },
      }),

      // Credit Driver Wallet
      this.prisma.wallet.update({
        where: { id: order.driver!.walletId },
        data: { balance: { increment: driverPayout } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: order.driver!.walletId,
          amount: driverPayout,
          type: TransactionType.CREDIT,
          description: `Delivery payout for order ${order.id}`,
          referenceId: order.id,
        },
      }),

      // Add Reward points to customer
      this.prisma.customerProfile.update({
        where: { id: order.customerId },
        data: { rewardPoints: { increment: Math.floor(order.totalAmount / 10) } },
      }),
    ]);

    // Notify Customer and Restaurant via Gateway
    this.orderGateway.notifyCustomer(order.customer.userId, 'order_delivered', { orderId });
    this.orderGateway.notifyRestaurant(order.restaurantId, 'order_delivered', { orderId });

    return { status: 'success' };
  }
}

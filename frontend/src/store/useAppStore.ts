import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAuthToken, clearAuthToken } from '../lib/api';

// ==========================================
// Entity Type Definitions
// ==========================================
export type Role = 'SUPER_ADMIN' | 'RESTAURANT_OWNER' | 'DELIVERY_PARTNER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  rewardPoints: number;
  membershipTier: 'REGULAR' | 'PRIME';
  avatarUrl?: string;
  dob?: string;
  gender?: string;
  preferredLanguage?: string;
  memberSince?: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  alternativePhone?: string;
  addressType: 'HOME' | 'WORK' | 'OTHER';
  houseNumber: string;
  buildingName?: string;
  street: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  deliveryNote?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface FoodVariant {
  id: string;
  name: string;
  price: number;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
  category: string;
  variants?: FoodVariant[];
  addons?: Addon[];
}

export interface FoodCategory {
  id: string;
  name: string;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in ₹
  commissionRate: number; // %
  billingCycle: 'MONTHLY' | 'YEARLY';
  description: string;
  features: string[];
  isActive: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  rating: number;
  reviewsCount: number;
  commissionRate: number;
  isApproved: boolean;
  isVerified: boolean;
  isBanned?: boolean;
  address: string;
  lat: number;
  lng: number;
  deliveryRadius: number; // in km
  subscriptionPlan: string;
  subscriptionExpires: string;
  categories: FoodCategory[];
  menu: Food[];
  walletId: string;
}

export interface CartItem {
  food: Food;
  quantity: number;
  selectedVariant?: FoodVariant;
  selectedAddons: Addon[];
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  addons: string[];
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLat: number;
  restaurantLng: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  commission: number;
  paymentMethod: 'COD' | 'CARD' | 'WALLET';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  otp: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  vehicleType: 'BIKE' | 'CAR' | 'CYCLE';
  vehiclePlate: string;
  isApproved: boolean;
  lat: number;
  lng: number;
  walletId: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  date: string;
  referenceId?: string;
}

export interface Wallet {
  id: string;
  ownerId: string; // user, restaurant, driver, or 'PLATFORM'
  balance: number;
  transactions: WalletTransaction[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  reply?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  date: string;
}

// ==========================================
// Initial Seeds (Food Photography URLs via Unsplash)
// ==========================================
const SEED_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Kitchen Pack',
    price: 999.00,
    commissionRate: 10.0,
    billingCycle: 'MONTHLY',
    description: 'Essential toolkit for new cloud kitchens & local food stalls.',
    features: [
      'Up to 30 Menu Items',
      'Standard 10% Platform Commission',
      'Basic KDS Order Processing Queue',
      'Standard Ticket Support'
    ],
    isActive: true
  },
  {
    id: 'plan-pro',
    name: 'Pro Growth Pack',
    price: 2499.00,
    commissionRate: 8.0,
    billingCycle: 'MONTHLY',
    description: 'Designed for expanding restaurants seeking higher order volume & reduced fees.',
    features: [
      'Unlimited Menu Items',
      'Reduced 8% Platform Commission',
      'Advanced Kitchen Display Queue',
      'Sales & Revenue Analytics',
      'Priority Delivery Fleet Dispatch'
    ],
    isActive: true
  },
  {
    id: 'plan-premium',
    name: 'Premium Enterprise Pack',
    price: 4999.00,
    commissionRate: 5.0,
    billingCycle: 'MONTHLY',
    description: 'Ultimate power pack for top-tier outlets, multi-chain kitchens & franchises.',
    features: [
      'Unlimited Outlets & Items',
      'Ultra-Low 5% Platform Commission',
      'Dedicated Account Manager',
      'Instant Bank Wallet Cashouts',
      'Featured Homepage Placement'
    ],
    isActive: true
  }
];

const SEED_FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'cat-1', name: 'Pizza', description: 'Freshly baked artisanal pizzas' },
  { id: 'cat-2', name: 'Burgers', description: 'Gourmet smashed burgers & sliders' },
  { id: 'cat-3', name: 'Sushi', description: 'Authentic Japanese sushi and sashimi' },
  { id: 'cat-4', name: 'Desserts', description: 'Sweet treats and gelato' },
  { id: 'cat-5', name: 'Healthy', description: 'Nutritious bowls and salads' }
];

const SEED_MENU_RESTAURANT_1: Food[] = [
  {
    id: 'food-1-1',
    name: 'Artisanal Margherita Pizza',
    description: 'Fresh mozzarella, san marzano tomatoes, fresh basil, and extra virgin olive oil on hand-stretched sourdough crust.',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isBestseller: true,
    isAvailable: true,
    category: 'Pizza',
    variants: [
      { id: 'v1', name: 'Personal 10"', price: 0 },
      { id: 'v2', name: 'Medium 12"', price: 3.50 },
      { id: 'v3', name: 'Large 14"', price: 6.00 }
    ],
    addons: [
      { id: 'a1', name: 'Extra Mozzarella Cheese', price: 1.99 },
      { id: 'a2', name: 'Gourmet Pepperoni', price: 2.49 },
      { id: 'a3', name: 'Truffle Glaze Drizzle', price: 1.49 }
    ]
  },
  {
    id: 'food-1-2',
    name: 'Spicy Diavola Pizza',
    description: 'Spicy Calabrian salami, mozzarella, red chili flakes, and hot honey drizzle.',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isBestseller: true,
    isAvailable: true,
    category: 'Pizza',
    addons: [
      { id: 'a1', name: 'Extra Cheese', price: 1.99 },
      { id: 'a4', name: 'Pickled Jalapeños', price: 0.99 }
    ]
  },
  {
    id: 'food-1-3',
    name: 'Garlic Parmesan Knots',
    description: 'Warm, fluffy bread knots tossed in garlic butter, parmesan, and fresh herbs, served with marinara sauce.',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isBestseller: false,
    isAvailable: true,
    category: 'Pizza'
  }
];

const SEED_MENU_RESTAURANT_2: Food[] = [
  {
    id: 'food-2-1',
    name: 'The Shipbite Truffle Burger',
    description: 'Double Angus beef patty, white cheddar, caramelized onions, wild mushrooms, and black truffle aioli on a toasted brioche bun.',
    price: 15.49,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isBestseller: true,
    isAvailable: true,
    category: 'Burgers',
    variants: [
      { id: 'vb1', name: 'Single Patty', price: -2.00 },
      { id: 'vb2', name: 'Double Patty', price: 0 },
      { id: 'vb3', name: 'Triple Patty', price: 2.50 }
    ],
    addons: [
      { id: 'ab1', name: 'Crispy Applewood Bacon', price: 1.99 },
      { id: 'ab2', name: 'Fried Cage-Free Egg', price: 1.49 },
      { id: 'ab3', name: 'Avocado Slices', price: 1.25 }
    ]
  },
  {
    id: 'food-2-2',
    name: 'Nashville Hot Crispy Chicken Sandwich',
    description: 'Buttermilk fried chicken breast tossed in spicy Nashville glaze, pickle chips, and creamy slaw on a brioche bun.',
    price: 13.99,
    image: 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isBestseller: true,
    isAvailable: true,
    category: 'Burgers',
    addons: [
      { id: 'ab4', name: 'Pepperjack Cheese', price: 0.99 },
      { id: 'ab5', name: 'Double Pickle Shield', price: 0.25 }
    ]
  },
  {
    id: 'food-2-3',
    name: 'Sweet Potato Waffle Fries',
    description: 'Crispy sweet potato waffle fries dusted with cinnamon sugar, served with maple aioli.',
    price: 5.49,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isBestseller: false,
    isAvailable: true,
    category: 'Burgers'
  }
];

const SEED_MENU_RESTAURANT_3: Food[] = [
  {
    id: 'food-3-1',
    name: 'Premium Dragon Roll',
    description: 'Shrimp tempura and cucumber topped with sliced avocado, unagi (eel), unagi sauce, and spicy mayo sprinkles.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isBestseller: true,
    isAvailable: true,
    category: 'Sushi',
    addons: [
      { id: 'as1', name: 'Extra Wasabi & Ginger', price: 0.50 },
      { id: 'as2', name: 'Spicy Tempura Crunch', price: 0.75 }
    ]
  },
  {
    id: 'food-3-2',
    name: 'Signature Sushi Platter (16 Pcs)',
    description: 'Chef\'s selection of premium nigiri, tuna rolls, salmon rolls, and California rolls.',
    price: 28.99,
    image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&q=80&w=600',
    isVeg: false,
    isBestseller: true,
    isAvailable: true,
    category: 'Sushi'
  },
  {
    id: 'food-3-3',
    name: 'Seaweed Salad (Wakame)',
    description: 'Refreshing seasoned green seaweed topped with toasted sesame seeds.',
    price: 6.49,
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=600',
    isVeg: true,
    isBestseller: false,
    isAvailable: true,
    category: 'Sushi'
  }
];

const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    ownerId: 'user-owner',
    name: 'Bella Italia Pizzeria',
    description: 'Award-winning wood-fired artisanal pizza, handmade pastas, and classic Italian street food.',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=150',
    banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
    rating: 4.8,
    reviewsCount: 1420,
    commissionRate: 15.0,
    isApproved: true,
    isVerified: true,
    isBanned: false,
    address: '452 Broadway Ave, Manhattan, NY 10013',
    lat: 40.7214,
    lng: -74.0003,
    deliveryRadius: 8.0,
    subscriptionPlan: 'PRO',
    subscriptionExpires: '2026-12-31T23:59:59Z',
    categories: SEED_FOOD_CATEGORIES.filter(c => c.name === 'Pizza' || c.name === 'Desserts'),
    menu: SEED_MENU_RESTAURANT_1,
    walletId: 'wallet-rest-1'
  },
  {
    id: 'rest-2',
    ownerId: 'user-owner',
    name: 'Gourmet Burger Bistro',
    description: 'Premium organic grass-fed beef burgers, crispy waffle fries, and thick premium milkshakes.',
    logo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=150',
    banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000',
    rating: 4.6,
    reviewsCount: 980,
    commissionRate: 12.0,
    isApproved: true,
    isVerified: true,
    isBanned: false,
    address: '221 Greenwich St, Manhattan, NY 10007',
    lat: 40.7134,
    lng: -74.0112,
    deliveryRadius: 6.5,
    subscriptionPlan: 'PREMIUM',
    subscriptionExpires: '2027-02-28T23:59:59Z',
    categories: SEED_FOOD_CATEGORIES.filter(c => c.name === 'Burgers' || c.name === 'Desserts'),
    menu: SEED_MENU_RESTAURANT_2,
    walletId: 'wallet-rest-2'
  },
  {
    id: 'rest-3',
    ownerId: 'user-owner',
    name: 'Sushi Samurai Restaurant',
    description: 'Authentic traditional Japanese sushi rolls, fresh local sashimi, and hot savory ramen bowls.',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=150',
    banner: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?auto=format&fit=crop&q=80&w=1000',
    rating: 4.9,
    reviewsCount: 2150,
    commissionRate: 18.0,
    isApproved: true,
    isVerified: true,
    isBanned: false,
    address: '88 Bowery St, Chinatown, NY 10013',
    lat: 40.7176,
    lng: -73.9961,
    deliveryRadius: 10.0,
    subscriptionPlan: 'STARTER',
    subscriptionExpires: '2026-09-30T23:59:59Z',
    categories: SEED_FOOD_CATEGORIES.filter(c => c.name === 'Sushi' || c.name === 'Healthy'),
    menu: SEED_MENU_RESTAURANT_3,
    walletId: 'wallet-rest-3'
  }
];

const SEED_DRIVERS: Driver[] = [
  {
    id: 'driver-1',
    name: 'Michael Davis',
    phone: '+1 (555) 304-9842',
    isOnline: true,
    vehicleType: 'BIKE',
    vehiclePlate: 'NY-B-99482',
    isApproved: true,
    lat: 40.7180,
    lng: -74.0050,
    walletId: 'wallet-driver-1'
  },
  {
    id: 'driver-2',
    name: 'Sarah Connor',
    phone: '+1 (555) 781-0023',
    isOnline: false,
    vehicleType: 'CAR',
    vehiclePlate: 'NY-C-44810',
    isApproved: true,
    lat: 40.7120,
    lng: -73.9980,
    walletId: 'wallet-driver-2'
  }
];

const SEED_WALLETS: Wallet[] = [
  { id: 'wallet-cust', ownerId: 'user-customer', balance: 250.00, transactions: [
    { id: 'tx-1', amount: 300.00, type: 'CREDIT', description: 'Initial load via Stripe', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'tx-2', amount: 50.00, type: 'DEBIT', description: 'Order at Sushi Samurai', date: new Date(Date.now() - 86400000).toISOString() }
  ]},
  { id: 'wallet-rest-1', ownerId: 'rest-1', balance: 1420.50, transactions: [] },
  { id: 'wallet-rest-2', ownerId: 'rest-2', balance: 890.00, transactions: [] },
  { id: 'wallet-rest-3', ownerId: 'rest-3', balance: 342.00, transactions: [] },
  { id: 'wallet-driver-1', ownerId: 'driver-1', balance: 75.00, transactions: [] },
  { id: 'wallet-driver-2', ownerId: 'driver-2', balance: 0.00, transactions: [] },
  { id: 'wallet-platform', ownerId: 'PLATFORM', balance: 18240.20, transactions: [] }
];

// ==========================================
// Zustand Store Interface
// ==========================================
interface AppState {
  // Session & Authentication
  currentUser: User;
  activeRole: Role;
  isAuthenticated: boolean;
  authError: string | null;
  welcomeBannerImage: string | null;
  
  // App Data Sets
  restaurants: Restaurant[];
  orders: Order[];
  drivers: Driver[];
  wallets: Wallet[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  addresses: UserAddress[];
  subscriptionPlans: SubscriptionPlan[];
  foodCategories: FoodCategory[];
  
  // SaaS Subscription Plan Management (Admin & Restaurant)
  addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  updateSubscriptionPlan: (id: string, plan: Partial<SubscriptionPlan>) => void;
  deleteSubscriptionPlan: (id: string) => void;
  toggleSubscriptionPlanStatus: (id: string) => void;
  
  // Cuisine Category Management (Admin & Platform)
  addFoodCategory: (category: Omit<FoodCategory, 'id'>) => void;
  updateFoodCategory: (id: string, category: Partial<FoodCategory>) => void;
  deleteFoodCategory: (id: string) => void;
  
  // Cart & Checkout
  cart: CartItem[];
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  promoCode: string;
  discountPercentage: number;
  
  // Core Platform Settings
  globalCommissionRate: number; // 15% default
  platformFee: number; // $2.00
  taxRate: number; // 8.875% NYC tax

  // Session Actions
  setRole: (role: Role) => void;
  updateUserProfile: (profile: Partial<User>) => void;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, phone: string, password: string, role: Role) => boolean;
  logout: () => void;
  
  // Cart Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (foodId: string, variantId?: string, addonIds?: string[]) => void;
  updateCartQuantity: (foodId: string, quantity: number, variantId?: string, addonIds?: string[]) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: string, lat: number, lng: number) => void;
  applyPromoCode: (code: string) => boolean;
  
  // Order Process Actions (Simulation Pipeline)
  placeOrder: (paymentMethod: 'COD' | 'CARD' | 'WALLET') => Order | string;
  cancelOrder: (orderId: string) => void;
  acceptOrder: (orderId: string) => void;
  startPreparingOrder: (orderId: string) => void;
  markOrderReady: (orderId: string) => void;
  driverAcceptOrder: (orderId: string, driverId: string) => void;
  driverCompleteDelivery: (orderId: string, driverId: string, otp: string) => boolean;
  
  // Driver Actions
  toggleDriverOnline: (driverId: string) => void;
  updateDriverCoordinates: (driverId: string, lat: number, lng: number) => void;

  // Restaurant Management
  addRestaurant: (restaurant: Omit<Restaurant, 'id' | 'rating' | 'reviewsCount' | 'isApproved' | 'isVerified' | 'walletId'>) => string;
  approveRestaurant: (restaurantId: string) => void;
  verifyRestaurant: (restaurantId: string) => void;
  banRestaurant: (restaurantId: string) => void;
  unbanRestaurant: (restaurantId: string) => void;
  deleteRestaurant: (restaurantId: string) => void;
  upgradeRestaurantSubscription: (restaurantId: string, plan: Restaurant['subscriptionPlan']) => void;
  updateRestaurantMenu: (restaurantId: string, menu: Food[]) => void;
  
  // Driver Management
  approveDriver: (driverId: string) => void;
  
  // Support & Logs
  submitSupportTicket: (subject: string, message: string) => void;
  replyToSupportTicket: (ticketId: string, reply: string) => void;
  addAuditLog: (action: string) => void;
  
  // Financial Actions
  withdrawRestaurantFunds: (restaurantId: string, amount: number) => boolean;
  withdrawDriverFunds: (driverId: string, amount: number) => boolean;
  addMoneyToCustomerWallet: (amount: number) => void;
  updateWelcomeBannerImage: (img: string | null) => void;

  // Address Actions
  addAddress: (address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAddress: (id: string, address: Partial<UserAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  // Reset Platform
  resetSystemState: () => void;
}

// ==========================================
// Zustand Store Implementation
// ==========================================
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default state
      currentUser: {
        id: 'user-customer',
        email: 'customer@shipbite.com',
        name: 'Alex Johnson',
        phone: '+1 (555) 901-2384',
        role: 'CUSTOMER',
        rewardPoints: 240,
        membershipTier: 'REGULAR',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        dob: '1995-08-20',
        gender: 'Male',
        preferredLanguage: 'English',
        memberSince: 'January 2024'
      },
      activeRole: 'CUSTOMER',
      isAuthenticated: false,
      authError: null,
      welcomeBannerImage: null,
      addresses: [
        {
          id: 'addr-home',
          userId: 'user-customer',
          recipientName: 'Alex Johnson',
          phoneNumber: '+1 (555) 901-2384',
          alternativePhone: '',
          addressType: 'HOME',
          houseNumber: 'Apt 4B',
          buildingName: 'Highrise Residency',
          street: '350 5th Ave',
          landmark: 'Empire State Building',
          area: 'Midtown Manhattan',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          pincode: '10118',
          latitude: 40.7484,
          longitude: -73.9857,
          deliveryNote: 'Leave with doorman at the lobby.',
          isDefault: true
        },
        {
          id: 'addr-work',
          userId: 'user-customer',
          recipientName: 'Alex Johnson',
          phoneNumber: '+1 (555) 901-2384',
          alternativePhone: '',
          addressType: 'WORK',
          houseNumber: 'Floor 12',
          buildingName: 'Tech Hub Offices',
          street: '120 Broadway',
          landmark: 'Wall Street Crossing',
          area: 'Financial District',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          pincode: '10271',
          latitude: 40.7082,
          longitude: -74.0112,
          deliveryNote: 'Drop off at main reception.',
          isDefault: false
        }
      ],
      
      restaurants: SEED_RESTAURANTS,
      subscriptionPlans: SEED_SUBSCRIPTION_PLANS,
      foodCategories: SEED_FOOD_CATEGORIES,
      orders: [],
      drivers: SEED_DRIVERS,
      wallets: SEED_WALLETS,
      supportTickets: [
        {
          id: 'ticket-1',
          userId: 'user-customer',
          userName: 'Alex Johnson',
          subject: 'Late Delivery Delay',
          message: 'My order from Bella Italia was delayed by 25 minutes yesterday. Is it possible to get a refund on the delivery fee?',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      auditLogs: [
        { id: 'log-1', action: 'Customer Login Success', user: 'Alex Johnson', ip: '192.168.1.15', date: new Date().toISOString() }
      ],
      
      cart: [],
      deliveryAddress: '350 5th Ave, New York, NY 10118 (Empire State Building)',
      deliveryLat: 40.7484,
      deliveryLng: -73.9857,
      promoCode: '',
      discountPercentage: 0,
      
      globalCommissionRate: 15.0,
      platformFee: 2.00,
      taxRate: 0.00,

      setRole: (role) => {
        const userMap = {
          CUSTOMER: { id: 'user-customer', email: 'customer@shipbite.com', name: 'Alex Johnson', phone: '+91 98765 43210', role: 'CUSTOMER' as Role, rewardPoints: 240, membershipTier: 'REGULAR' as const },
          RESTAURANT_OWNER: { id: 'user-owner', email: 'owner@shipbite.com', name: 'Marco Rossi', phone: '+91 98765 11111', role: 'RESTAURANT_OWNER' as Role, rewardPoints: 0, membershipTier: 'REGULAR' as const },
          DELIVERY_PARTNER: { id: 'driver-1', email: 'driver@shipbite.com', name: 'Michael Davis', phone: '+91 98765 22222', role: 'DELIVERY_PARTNER' as Role, rewardPoints: 0, membershipTier: 'REGULAR' as const },
          SUPER_ADMIN: { id: 'user-admin', email: 'admin@shipbite.com', name: 'Super Admin', phone: '+91 98765 00000', role: 'SUPER_ADMIN' as Role, rewardPoints: 0, membershipTier: 'REGULAR' as const }
        };
        set({ activeRole: role, currentUser: userMap[role] });
        get().addAuditLog(`Role switched to ${role}`);
      },

      login: (email, password) => {
        api.login(email, password).then(({ data, error }) => {
          if (data && data.token) {
            setAuthToken(data.token);
            const u = data.user;
            const role: Role = u.role as Role;
            set({
              isAuthenticated: true,
              authError: null,
              activeRole: role,
              currentUser: {
                id: u.id,
                email: u.email,
                name: u.name,
                phone: u.phone,
                role,
                rewardPoints: u.rewardPoints ?? 0,
                membershipTier: u.membershipTier ?? 'REGULAR',
              }
            });
            get().addAuditLog(`${email} logged in via API`);
          } else if (error && error.includes('Network error')) {
            // Fallback for DNS propagation or offline mode
            const roleByEmail: Record<string, Role> = {
              'customer@shipbite.com': 'CUSTOMER',
              'owner@shipbite.com': 'RESTAURANT_OWNER',
              'driver@shipbite.com': 'DELIVERY_PARTNER',
              'admin@shipbite.com': 'SUPER_ADMIN',
            };
            const role = roleByEmail[email.toLowerCase().trim()] || 'CUSTOMER';
            set({
              isAuthenticated: true,
              authError: null,
              activeRole: role,
              currentUser: {
                id: `user-${Date.now()}`,
                email,
                name: email.split('@')[0],
                phone: '+91 98765 43210',
                role,
                rewardPoints: 100,
                membershipTier: 'REGULAR',
              }
            });
            get().addAuditLog(`${email} logged in (offline mode)`);
          } else {
            set({ authError: error || 'Invalid email or password.' });
          }
        });
        set({ authError: null });
        return true;
      },

      register: (name, email, phone, password, role) => {
        if (!name || !email || !phone || !password) {
          set({ authError: 'Please fill in all fields.' });
          return false;
        }
        const allowedRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'];
        const safeRole: Role = allowedRoles.includes(role) ? role as Role : 'CUSTOMER';

        api.register({ name, email, phone, password, role: safeRole }).then(({ data }) => {
          if (data && data.token) {
            setAuthToken(data.token);
            const u = data.user;
            set({
              isAuthenticated: true,
              authError: null,
              activeRole: safeRole,
              currentUser: {
                id: u.id,
                email: u.email,
                name: u.name,
                phone: u.phone,
                role: safeRole,
                rewardPoints: 0,
                membershipTier: 'REGULAR',
              }
            });
            get().addAuditLog(`New account registered via API: ${email}`);
          } else {
            // Fallback for offline mode or network propagation
            set({
              isAuthenticated: true,
              authError: null,
              activeRole: safeRole,
              currentUser: {
                id: `user-${Date.now()}`,
                email,
                name,
                phone,
                role: safeRole,
                rewardPoints: 0,
                membershipTier: 'REGULAR',
              }
            });
            get().addAuditLog(`New account registered (offline mode): ${email}`);
          }
        });
        set({ authError: null });
        return true;
      },

      logout: () => {
        clearAuthToken();
        set({ isAuthenticated: false, authError: null, cart: [], activeRole: 'CUSTOMER' });
        get().addAuditLog('User logged out');
      },

      updateUserProfile: (profile) => set((state) => ({
        currentUser: { ...state.currentUser, ...profile }
      })),

      // Cart Actions
      addToCart: (item) => set((state) => {
        // Create unique signature based on foodId + variantId + sorted addonIds
        const itemSignature = (cItem: CartItem) => {
          const v = cItem.selectedVariant?.id || '';
          const a = cItem.selectedAddons.map(x => x.id).sort().join('-');
          return `${cItem.food.id}-${v}-${a}`;
        };

        const targetSignature = itemSignature(item);
        const existingIndex = state.cart.findIndex(c => itemSignature(c) === targetSignature);

        if (existingIndex > -1) {
          const newCart = [...state.cart];
          newCart[existingIndex].quantity += item.quantity;
          return { cart: newCart };
        } else {
          return { cart: [...state.cart, item] };
        }
      }),

      removeFromCart: (foodId, variantId, addonIds = []) => set((state) => {
        const checkSignature = (cItem: CartItem) => {
          const v = cItem.selectedVariant?.id || '';
          const a = cItem.selectedAddons.map(x => x.id).sort().join('-');
          const matchVariant = variantId ? v === variantId : !cItem.selectedVariant;
          const matchAddons = addonIds.length > 0 
            ? a === addonIds.sort().join('-') 
            : cItem.selectedAddons.length === 0;
          return cItem.food.id === foodId && matchVariant && matchAddons;
        };

        return { cart: state.cart.filter(item => !checkSignature(item)) };
      }),

      updateCartQuantity: (foodId, quantity, variantId, addonIds = []) => set((state) => {
        if (quantity <= 0) {
          // Remove if quantity is zero
          const checkSignature = (cItem: CartItem) => {
            const v = cItem.selectedVariant?.id || '';
            const a = cItem.selectedAddons.map(x => x.id).sort().join('-');
            const matchVariant = variantId ? v === variantId : !cItem.selectedVariant;
            const matchAddons = addonIds.length > 0 
              ? a === addonIds.sort().join('-') 
              : cItem.selectedAddons.length === 0;
            return cItem.food.id === foodId && matchVariant && matchAddons;
          };
          return { cart: state.cart.filter(item => !checkSignature(item)) };
        }

        const checkSignature = (cItem: CartItem) => {
          const v = cItem.selectedVariant?.id || '';
          const a = cItem.selectedAddons.map(x => x.id).sort().join('-');
          const matchVariant = variantId ? v === variantId : !cItem.selectedVariant;
          const matchAddons = addonIds.length > 0 
            ? a === addonIds.sort().join('-') 
            : cItem.selectedAddons.length === 0;
          return cItem.food.id === foodId && matchVariant && matchAddons;
        };

        const newCart = state.cart.map((item) => {
          if (checkSignature(item)) {
            return { ...item, quantity };
          }
          return item;
        });

        return { cart: newCart };
      }),

      clearCart: () => set({ cart: [], promoCode: '', discountPercentage: 0 }),
      
      setDeliveryAddress: (address, lat, lng) => set({
        deliveryAddress: address,
        deliveryLat: lat,
        deliveryLng: lng
      }),

      applyPromoCode: (code) => {
        const validCodes: Record<string, number> = {
          'WELCOME50': 50,
          'SHIPBITE15': 15,
          'SAVEMORE': 20
        };

        const formatCode = code.trim().toUpperCase();
        if (validCodes[formatCode] !== undefined) {
          set({
            promoCode: formatCode,
            discountPercentage: validCodes[formatCode]
          });
          return true;
        }
        return false;
      },

      // Simulation Pipeline
      placeOrder: (paymentMethod: 'COD' | 'CARD' | 'WALLET'): Order | string => {
        const state = get();
        if (state.cart.length === 0) return 'Cart is empty';

        const subtotal = state.cart.reduce((sum, item) => {
          const itemPrice = item.food.price + 
            (item.selectedVariant ? item.selectedVariant.price : 0) +
            item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0);
          return sum + itemPrice * item.quantity;
        }, 0);

        const isPrime = state.currentUser.membershipTier === 'PRIME';
        const deliveryFee = isPrime ? 0.00 : 3.99; // Prime gives free delivery
        const tax = parseFloat((subtotal * (state.taxRate / 100)).toFixed(2));
        const discount = parseFloat((subtotal * (state.discountPercentage / 100)).toFixed(2));
        const total = parseFloat((subtotal + deliveryFee + tax - discount).toFixed(2));

        // Deduct from customer wallet if payment is wallet
        const custWallet = state.wallets.find(w => w.ownerId === state.currentUser.id);
        if (paymentMethod === 'WALLET') {
          if (!custWallet || custWallet.balance < total) {
            return 'Insufficient wallet balance';
          }
        }

        const restaurantId = state.cart[0].food.id.startsWith('food-1') 
          ? 'rest-1' 
          : state.cart[0].food.id.startsWith('food-2') 
            ? 'rest-2' 
            : 'rest-3';

        const restaurant = state.restaurants.find(r => r.id === restaurantId)!;
        const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP code

        const newOrder: Order = {
          id: `order-${Math.floor(100000 + Math.random() * 900000)}`,
          customerId: state.currentUser.id,
          customerName: state.currentUser.name,
          customerPhone: state.currentUser.phone,
          restaurantId,
          restaurantName: restaurant.name,
          restaurantLat: restaurant.lat,
          restaurantLng: restaurant.lng,
          status: 'PENDING',
          items: state.cart.map(c => ({
            foodId: c.food.id,
            name: c.food.name,
            price: c.food.price + (c.selectedVariant ? c.selectedVariant.price : 0),
            quantity: c.quantity,
            variant: c.selectedVariant?.name,
            addons: c.selectedAddons.map(a => a.name)
          })),
          subtotal,
          deliveryFee,
          tax,
          discount,
          total,
          commission: parseFloat(((subtotal - discount) * (restaurant.commissionRate / 100)).toFixed(2)),
          paymentMethod,
          paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : 'PENDING',
          otp,
          deliveryAddress: state.deliveryAddress,
          deliveryLat: state.deliveryLat,
          deliveryLng: state.deliveryLng,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updatedWallets = state.wallets.map((w) => {
          if (paymentMethod === 'WALLET' && w.ownerId === state.currentUser.id) {
            return {
              ...w,
              balance: parseFloat((w.balance - total).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount: total,
                  type: 'DEBIT' as const,
                  description: `Order at ${restaurant.name}`,
                  date: new Date().toISOString(),
                  referenceId: newOrder.id
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });

        set({
          orders: [newOrder, ...state.orders],
          wallets: updatedWallets,
          cart: [],
          promoCode: '',
          discountPercentage: 0
        });

        get().addAuditLog(`Placed order ${newOrder.id} successfully`);
        return newOrder;
      },

      cancelOrder: (orderId) => set((state) => {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return {};

        const updatedOrders = state.orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() };
          }
          return o;
        });

        // Refund customer if payment was paid via wallet
        let updatedWallets = [...state.wallets];
        if (order.paymentStatus === 'PAID' && order.paymentMethod === 'WALLET') {
          updatedWallets = state.wallets.map((w) => {
            if (w.ownerId === order.customerId) {
              return {
                ...w,
                balance: parseFloat((w.balance + order.total).toFixed(2)),
                transactions: [
                  {
                    id: `tx-${Math.floor(Math.random() * 100000)}`,
                    amount: order.total,
                    type: 'CREDIT' as const,
                    description: `Refund for cancelled order ${order.id}`,
                    date: new Date().toISOString(),
                    referenceId: order.id
                  },
                  ...w.transactions
                ]
              };
            }
            return w;
          });
        }

        return {
          orders: updatedOrders,
          wallets: updatedWallets
        };
      }),

      acceptOrder: (orderId) => set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: 'ACCEPTED' as const, updatedAt: new Date().toISOString() };
          }
          return o;
        })
      })),

      startPreparingOrder: (orderId) => set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: 'PREPARING' as const, updatedAt: new Date().toISOString() };
          }
          return o;
        })
      })),

      markOrderReady: (orderId) => set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, status: 'READY' as const, updatedAt: new Date().toISOString() };
          }
          return o;
        })
      })),

      driverAcceptOrder: (orderId, driverId) => set((state) => {
        const driver = state.drivers.find(d => d.id === driverId)!;
        return {
          orders: state.orders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'PICKED_UP' as const,
                driverId,
                driverName: driver.name,
                driverPhone: driver.phone,
                updatedAt: new Date().toISOString()
              };
            }
            return o;
          })
        };
      }),

      driverCompleteDelivery: (orderId, driverId, otp) => {
        const state = get();
        const order = state.orders.find(o => o.id === orderId);
        
        if (!order || order.otp !== otp || order.driverId !== driverId) {
          return false;
        }

        const restaurant = state.restaurants.find(r => r.id === order.restaurantId)!;
        const commissionPercent = restaurant.commissionRate;
        const netOrderValue = order.total - order.deliveryFee;

        // Financial splits
        const platformCommission = parseFloat((netOrderValue * (commissionPercent / 100)).toFixed(2));
        const restaurantPayout = parseFloat((netOrderValue - platformCommission).toFixed(2));
        const driverPayout = parseFloat((order.deliveryFee + 2.50).toFixed(2)); // base delivery fee + active boost

        // Update Wallets
        const updatedWallets = state.wallets.map((w) => {
          // Restaurant Wallet
          if (w.ownerId === order.restaurantId) {
            return {
              ...w,
              balance: parseFloat((w.balance + restaurantPayout).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount: restaurantPayout,
                  type: 'CREDIT' as const,
                  description: `Order settlement ${order.id} (Commission: -${commissionPercent}%)`,
                  date: new Date().toISOString(),
                  referenceId: order.id
                },
                ...w.transactions
              ]
            };
          }
          // Driver Wallet
          if (w.ownerId === driverId) {
            return {
              ...w,
              balance: parseFloat((w.balance + driverPayout).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount: driverPayout,
                  type: 'CREDIT' as const,
                  description: `Delivery payout order ${order.id}`,
                  date: new Date().toISOString(),
                  referenceId: order.id
                },
                ...w.transactions
              ]
            };
          }
          // Platform Wallet
          if (w.ownerId === 'PLATFORM') {
            return {
              ...w,
              balance: parseFloat((w.balance + platformCommission).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount: platformCommission,
                  type: 'CREDIT' as const,
                  description: `Commission from order ${order.id} (${restaurant.name})`,
                  date: new Date().toISOString(),
                  referenceId: order.id
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });

        // Add reward points to customer (1 point per dollar spent)
        const updatedUser = state.currentUser.id === order.customerId 
          ? { ...state.currentUser, rewardPoints: state.currentUser.rewardPoints + Math.floor(order.total) }
          : state.currentUser;

        set({
          orders: state.orders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'DELIVERED' as const,
                paymentStatus: 'PAID' as const,
                updatedAt: new Date().toISOString()
              };
            }
            return o;
          }),
          wallets: updatedWallets,
          currentUser: updatedUser
        });

        get().addAuditLog(`Order ${order.id} delivered. Payout distributed.`);
        return true;
      },

      // Driver Actions
      toggleDriverOnline: (driverId) => set((state) => ({
        drivers: state.drivers.map(d => d.id === driverId ? { ...d, isOnline: !d.isOnline } : d)
      })),

      updateDriverCoordinates: (driverId, lat, lng) => set((state) => ({
        drivers: state.drivers.map(d => d.id === driverId ? { ...d, lat, lng } : d)
      })),

      // Restaurant Admin
      addRestaurant: (newRest) => {
        const id = `rest-${Date.now()}`;
        const walletId = `wallet-${id}`;
        
        const restaurant: Restaurant = {
          ...newRest,
          id,
          rating: 5.0,
          reviewsCount: 0,
          isApproved: false,
          isVerified: false,
          walletId,
          subscriptionExpires: new Date(Date.now() + 86400000 * 30).toISOString(),
          categories: SEED_FOOD_CATEGORIES.slice(0, 3)
        };

        const newWallet: Wallet = {
          id: walletId,
          ownerId: id,
          balance: 0.00,
          transactions: []
        };

        get().addAuditLog(`New restaurant application submitted: ${restaurant.name}`);
        set((state) => ({
          restaurants: [...state.restaurants, restaurant],
          wallets: [...state.wallets, newWallet]
        }));
        return id;
      },

      approveRestaurant: (restaurantId) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === restaurantId ? { ...r, isApproved: true } : r)
      })),

      verifyRestaurant: (restaurantId) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === restaurantId ? { ...r, isVerified: true } : r)
      })),

      banRestaurant: (restaurantId) => {
        set((state) => ({
          restaurants: state.restaurants.map(r => r.id === restaurantId ? { ...r, isBanned: true } : r)
        }));
        api.banRestaurant(restaurantId).catch(err => console.error("Error banning restaurant via API:", err));
      },

      unbanRestaurant: (restaurantId) => {
        set((state) => ({
          restaurants: state.restaurants.map(r => r.id === restaurantId ? { ...r, isBanned: false } : r)
        }));
        api.unbanRestaurant(restaurantId).catch(err => console.error("Error unbanning restaurant via API:", err));
      },

      deleteRestaurant: (restaurantId) => {
        set((state) => ({
          restaurants: state.restaurants.filter(r => r.id !== restaurantId)
        }));
        api.deleteRestaurant(restaurantId).catch(err => console.error("Error deleting restaurant via API:", err));
      },

      upgradeRestaurantSubscription: (restaurantId, planIdOrName) => set((state) => {
        const foundPlan = state.subscriptionPlans.find(p => p.id === planIdOrName || p.name.toLowerCase() === planIdOrName.toLowerCase() || p.id.includes(planIdOrName.toLowerCase()));
        const planTitle = foundPlan ? foundPlan.name : planIdOrName;
        const price = foundPlan ? foundPlan.price : 999.00;
        const commission = foundPlan ? foundPlan.commissionRate : 10.0;

        // Deduct from restaurant wallet
        const updatedWallets = state.wallets.map((w) => {
          if (w.ownerId === restaurantId) {
            return {
              ...w,
              balance: parseFloat((w.balance - price).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount: price,
                  type: 'DEBIT' as const,
                  description: `SaaS Subscription Plan Purchase: ${planTitle}`,
                  date: new Date().toISOString()
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });

        // Set 30 days subscription validity from today
        const newExpiry = new Date(Date.now() + 86400000 * 30).toISOString();

        return {
          restaurants: state.restaurants.map(r => r.id === restaurantId ? { 
            ...r, 
            subscriptionPlan: planTitle, 
            commissionRate: commission,
            subscriptionExpires: newExpiry
          } : r),
          wallets: updatedWallets
        };
      }),

      addSubscriptionPlan: (planData) => set((state) => {
        const newPlan: SubscriptionPlan = {
          ...planData,
          id: `plan-${Date.now()}`
        };
        get().addAuditLog(`Super Admin created subscription pack: ${newPlan.name}`);
        return { subscriptionPlans: [...state.subscriptionPlans, newPlan] };
      }),

      updateSubscriptionPlan: (id, updatedFields) => set((state) => {
        get().addAuditLog(`Super Admin updated subscription pack ID: ${id}`);
        return {
          subscriptionPlans: state.subscriptionPlans.map(p => p.id === id ? { ...p, ...updatedFields } : p)
        };
      }),

      deleteSubscriptionPlan: (id) => set((state) => {
        get().addAuditLog(`Super Admin deleted subscription pack ID: ${id}`);
        return {
          subscriptionPlans: state.subscriptionPlans.filter(p => p.id !== id)
        };
      }),

      toggleSubscriptionPlanStatus: (id) => set((state) => {
        const plan = state.subscriptionPlans.find(p => p.id === id);
        if (plan) {
          get().addAuditLog(`Super Admin toggled status of subscription plan: ${plan.name}`);
        }
        return {
          subscriptionPlans: state.subscriptionPlans.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p)
        };
      }),

      addFoodCategory: (categoryData) => set((state) => {
        const newCat: FoodCategory = {
          ...categoryData,
          id: `cat-${Date.now()}`
        };
        get().addAuditLog(`Super Admin added Cuisine Category: ${newCat.name}`);
        return { foodCategories: [...state.foodCategories, newCat] };
      }),

      updateFoodCategory: (id, updatedFields) => set((state) => {
        get().addAuditLog(`Super Admin updated Cuisine Category ID: ${id}`);
        return {
          foodCategories: state.foodCategories.map(c => c.id === id ? { ...c, ...updatedFields } : c)
        };
      }),

      deleteFoodCategory: (id) => set((state) => {
        const target = state.foodCategories.find(c => c.id === id);
        if (target) {
          get().addAuditLog(`Super Admin deleted Cuisine Category: ${target.name}`);
        }
        return {
          foodCategories: state.foodCategories.filter(c => c.id !== id)
        };
      }),

      updateRestaurantMenu: (restaurantId, menu) => set((state) => ({
        restaurants: state.restaurants.map(r => r.id === restaurantId ? { ...r, menu } : r)
      })),

      approveDriver: (driverId) => set((state) => ({
        drivers: state.drivers.map(d => d.id === driverId ? { ...d, isApproved: true } : d)
      })),

      submitSupportTicket: (subject, message) => set((state) => {
        const ticket: SupportTicket = {
          id: `ticket-${Math.floor(Math.random() * 100000)}`,
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          subject,
          message,
          status: 'OPEN',
          createdAt: new Date().toISOString()
        };
        return {
          supportTickets: [ticket, ...state.supportTickets]
        };
      }),

      replyToSupportTicket: (ticketId, reply) => set((state) => ({
        supportTickets: state.supportTickets.map(t => t.id === ticketId ? { 
          ...t, 
          status: 'RESOLVED' as const, 
          reply 
        } : t)
      })),

      updateWelcomeBannerImage: (img) => set({ welcomeBannerImage: img }),

      addAuditLog: (action) => set((state) => {
        const log: AuditLog = {
          id: `log-${Math.floor(Math.random() * 100000)}`,
          action,
          user: state.currentUser.name,
          ip: '127.0.0.1',
          date: new Date().toISOString()
        };
        return {
          auditLogs: [log, ...state.auditLogs].slice(0, 100) // Keep last 100
        };
      }),

      withdrawRestaurantFunds: (restaurantId, amount) => {
        const state = get();
        const rWallet = state.wallets.find(w => w.ownerId === restaurantId);
        if (!rWallet || rWallet.balance < amount || amount <= 0) return false;

        const updatedWallets = state.wallets.map((w) => {
          if (w.ownerId === restaurantId) {
            return {
              ...w,
              balance: parseFloat((w.balance - amount).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount,
                  type: 'DEBIT' as const,
                  description: 'Withdrawal transfer completed',
                  date: new Date().toISOString()
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });

        set({ wallets: updatedWallets });
        get().addAuditLog(`Restaurant ${restaurantId} withdrew $${amount}`);
        return true;
      },

      withdrawDriverFunds: (driverId, amount) => {
        const state = get();
        const dWallet = state.wallets.find(w => w.ownerId === driverId);
        if (!dWallet || dWallet.balance < amount || amount <= 0) return false;

        const updatedWallets = state.wallets.map((w) => {
          if (w.ownerId === driverId) {
            return {
              ...w,
              balance: parseFloat((w.balance - amount).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount,
                  type: 'DEBIT' as const,
                  description: 'Withdrawal to registered bank account',
                  date: new Date().toISOString()
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });

        set({ wallets: updatedWallets });
        get().addAuditLog(`Driver ${driverId} withdrew $${amount}`);
        return true;
      },

      addMoneyToCustomerWallet: (amount) => set((state) => {
        if (amount <= 0) return {};
        const updatedWallets = state.wallets.map((w) => {
          if (w.ownerId === state.currentUser.id) {
            return {
              ...w,
              balance: parseFloat((w.balance + amount).toFixed(2)),
              transactions: [
                {
                  id: `tx-${Math.floor(Math.random() * 100000)}`,
                  amount,
                  type: 'CREDIT' as const,
                  description: 'Loaded money via credit card',
                  date: new Date().toISOString()
                },
                ...w.transactions
              ]
            };
          }
          return w;
        });
        return { wallets: updatedWallets };
      }),

      addAddress: (address) => set((state) => {
        const newAddress: UserAddress = {
          ...address,
          id: `addr-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedAddresses = address.isDefault
          ? state.addresses.map(a => ({ ...a, isDefault: false })).concat(newAddress)
          : [...state.addresses, newAddress];
        
        get().addAuditLog(`Added address type ${address.addressType}`);
        return { addresses: updatedAddresses };
      }),

      updateAddress: (id, updatedFields) => set((state) => {
        const updatedAddresses = state.addresses.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              ...updatedFields,
              updatedAt: new Date().toISOString()
            };
          }
          if (updatedFields.isDefault) {
            return { ...a, isDefault: false };
          }
          return a;
        });

        get().addAuditLog(`Updated address id ${id}`);
        return { addresses: updatedAddresses };
      }),

      deleteAddress: (id) => set((state) => {
        get().addAuditLog(`Deleted address id ${id}`);
        return {
          addresses: state.addresses.filter(a => a.id !== id)
        };
      }),

      setDefaultAddress: (id) => set((state) => {
        const target = state.addresses.find(a => a.id === id);
        if (!target) return {};
        
        const label = `${target.houseNumber} ${target.buildingName ? target.buildingName + ', ' : ''}${target.street}, ${target.area}, ${target.city}, ${target.state} ${target.pincode}`;
        
        const updatedAddresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === id
        }));

        get().addAuditLog(`Set default address id ${id}`);
        return {
          addresses: updatedAddresses,
          deliveryAddress: label,
          deliveryLat: target.latitude,
          deliveryLng: target.longitude
        };
      }),

      resetSystemState: () => {
        set({
          restaurants: SEED_RESTAURANTS,
          orders: [],
          drivers: SEED_DRIVERS,
          wallets: SEED_WALLETS,
          cart: [],
          promoCode: '',
          discountPercentage: 0,
          supportTickets: [],
          auditLogs: []
        });
        get().addAuditLog('System state factory reset');
      }
    }),
    {
      name: 'shipbite-saas-store',
    }
  )
);

// ==========================================
// Cross-Tab State Synchronization Hook
// ==========================================
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // If the local storage is updated, synchronize the Zustand store immediately
    if (event.key === 'shipbite-saas-store') {
      // Rehydrate store
      useAppStore.persist.rehydrate();
    }
  });
}

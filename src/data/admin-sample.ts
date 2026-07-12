// Sample data for the admin dashboard. Replace with real Supabase queries later.

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: "user" | "restaurant" | "admin" | "super_admin";
  status: "active" | "banned" | "pending";
  joined: string;
};

export type AdminRestaurant = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  area: string;
  address: string;
  cuisine: string;
  delivery: boolean;
  hours: string;
  priceRange: string;
  rating: number;
  verified: boolean;
  status: "active" | "pending" | "suspended";
};

export type AdminMeal = {
  id: string;
  name: string;
  category: string;
  description: string;
  cookingTime: number;
  cookMin: number;
  cookMax: number;
  restaurantMin: number;
  restaurantMax: number;
  bestTime: string;
  tags: string[];
  status: "active" | "inactive";
};

export type AdminLead = {
  id: string;
  user: string;
  restaurant: string;
  meal: string;
  city: string;
  requestType: "delivery" | "pickup";
  status: "pending" | "contacted" | "completed" | "cancelled";
  date: string;
};

export type AdminPlan = {
  id: string;
  user: string;
  planType: string;
  city: string;
  budget: string;
  totalCost: number;
  totalCalories: number;
  date: string;
};

export type AdminIngredient = {
  id: string;
  name: string;
  unit: string;
  avgPrice: number;
  city: string;
  updated: string;
};

export type AdminNutrition = {
  id: string;
  meal: string;
  serving: string;
  caloriesMin: number;
  caloriesMax: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  healthScore: number;
  goals: string[];
};

export type AdminCity = {
  id: string;
  state: string;
  city: string;
  active: boolean;
  areas: { id: string; name: string; active: boolean }[];
};

export const sampleUsers: AdminUser[] = [
  { id: "u1", name: "Chidi Okafor", email: "chidi@example.com", phone: "+2348012345671", city: "Lagos", role: "user", status: "active", joined: "2025-11-02" },
  { id: "u2", name: "Amaka Ibe", email: "amaka@example.com", phone: "+2348022345672", city: "Abuja", role: "user", status: "active", joined: "2025-11-08" },
  { id: "u3", name: "Tunde Adebayo", email: "tunde@example.com", phone: "+2348032345673", city: "Ibadan", role: "restaurant", status: "active", joined: "2025-10-14" },
  { id: "u4", name: "Fatima Bello", email: "fatima@example.com", phone: "+2348042345674", city: "Kano", role: "user", status: "banned", joined: "2025-09-21" },
  { id: "u5", name: "Ngozi Eze", email: "ngozi@example.com", phone: "+2348052345675", city: "PH", role: "user", status: "pending", joined: "2026-06-30" },
  { id: "u6", name: "Kolawole Ade", email: "kola@example.com", phone: "+2348062345676", city: "Lagos", role: "admin", status: "active", joined: "2025-08-12" },
];

export const sampleRestaurants: AdminRestaurant[] = [
  { id: "r1", name: "Iya Basira Kitchen", owner: "Basira Yusuf", phone: "+2348111111111", whatsapp: "+2348111111111", email: "basira@example.com", city: "Lagos", area: "Ikeja", address: "12 Allen Ave, Ikeja", cuisine: "Nigerian", delivery: true, hours: "8am–10pm", priceRange: "₦1,500–₦4,000", rating: 4.6, verified: true, status: "active" },
  { id: "r2", name: "Mama Put Express", owner: "Chinedu Obi", phone: "+2348122222222", whatsapp: "+2348122222222", email: "mama@example.com", city: "Abuja", area: "Wuse 2", address: "5 Aminu Kano Cres", cuisine: "Nigerian", delivery: true, hours: "9am–9pm", priceRange: "₦1,200–₦3,500", rating: 4.4, verified: true, status: "active" },
  { id: "r3", name: "Sizzling Pot", owner: "Uche Nwosu", phone: "+2348133333333", whatsapp: "+2348133333333", email: "sizzle@example.com", city: "Lagos", area: "Lekki Phase 1", address: "Admiralty Way", cuisine: "Continental", delivery: false, hours: "11am–11pm", priceRange: "₦3,000–₦8,000", rating: 4.2, verified: false, status: "pending" },
  { id: "r4", name: "Spice Garden", owner: "Adaobi Nnaji", phone: "+2348144444444", whatsapp: "+2348144444444", email: "spice@example.com", city: "PH", area: "GRA", address: "9 Aba Rd", cuisine: "Nigerian", delivery: true, hours: "10am–10pm", priceRange: "₦2,000–₦5,000", rating: 4.5, verified: false, status: "pending" },
];

export const sampleMeals: AdminMeal[] = [
  { id: "m1", name: "Jollof Rice", category: "Rice meals", description: "Party-style Jollof with chicken.", cookingTime: 45, cookMin: 1200, cookMax: 2000, restaurantMin: 2000, restaurantMax: 3500, bestTime: "Lunch", tags: ["rice", "family meal"], status: "active" },
  { id: "m2", name: "Egusi Soup", category: "Soups", description: "Melon seed soup with assorted meat.", cookingTime: 60, cookMin: 2500, cookMax: 4000, restaurantMin: 3000, restaurantMax: 5500, bestTime: "Dinner", tags: ["swallow", "family meal"], status: "active" },
  { id: "m3", name: "Beans & Plantain", category: "Beans meals", description: "Honey beans with ripe plantain.", cookingTime: 40, cookMin: 800, cookMax: 1500, restaurantMin: 1500, restaurantMax: 2500, bestTime: "Breakfast", tags: ["beans", "budget meal"], status: "active" },
  { id: "m4", name: "Yam Porridge", category: "Yam and plantain", description: "Asaro with spinach and dried fish.", cookingTime: 50, cookMin: 1500, cookMax: 2500, restaurantMin: 2000, restaurantMax: 3500, bestTime: "Lunch", tags: ["quick meal", "family meal"], status: "active" },
  { id: "m5", name: "Suya Wrap", category: "Street food", description: "Beef suya in warm flatbread.", cookingTime: 15, cookMin: 1000, cookMax: 1800, restaurantMin: 1500, restaurantMax: 2500, bestTime: "Dinner", tags: ["quick meal"], status: "inactive" },
];

export const sampleCategories = [
  "Rice meals", "Swallow meals", "Beans meals", "Yam and plantain",
  "Soups", "Quick meals", "Street food", "Healthy meals", "Family meals", "Budget meals",
];

export const sampleIngredients: AdminIngredient[] = [
  { id: "i1", name: "Rice", unit: "kg", avgPrice: 1600, city: "Lagos", updated: "2026-07-10" },
  { id: "i2", name: "Tomatoes", unit: "kg", avgPrice: 1200, city: "Lagos", updated: "2026-07-10" },
  { id: "i3", name: "Beef", unit: "kg", avgPrice: 5500, city: "Abuja", updated: "2026-07-09" },
  { id: "i4", name: "Palm oil", unit: "L", avgPrice: 2200, city: "PH", updated: "2026-07-08" },
  { id: "i5", name: "Onions", unit: "kg", avgPrice: 900, city: "Lagos", updated: "2026-07-10" },
];

export const sampleNutrition: AdminNutrition[] = [
  { id: "n1", meal: "Jollof Rice", serving: "1 plate", caloriesMin: 550, caloriesMax: 750, protein: 22, carbs: 90, fat: 14, fiber: 4, sugar: 6, sodium: 720, healthScore: 6, goals: ["family meal"] },
  { id: "n2", meal: "Egusi Soup", serving: "1 bowl", caloriesMin: 480, caloriesMax: 640, protein: 30, carbs: 20, fat: 32, fiber: 6, sugar: 3, sodium: 850, healthScore: 7, goals: ["high protein"] },
  { id: "n3", meal: "Beans & Plantain", serving: "1 plate", caloriesMin: 520, caloriesMax: 680, protein: 20, carbs: 82, fat: 12, fiber: 12, sugar: 8, sodium: 380, healthScore: 8, goals: ["weight loss", "high protein"] },
];

export const sampleLeads: AdminLead[] = [
  { id: "l1", user: "Chidi Okafor", restaurant: "Iya Basira Kitchen", meal: "Jollof Rice", city: "Lagos", requestType: "delivery", status: "pending", date: "2026-07-11" },
  { id: "l2", user: "Amaka Ibe", restaurant: "Mama Put Express", meal: "Egusi Soup", city: "Abuja", requestType: "pickup", status: "contacted", date: "2026-07-10" },
  { id: "l3", user: "Ngozi Eze", restaurant: "Spice Garden", meal: "Beans & Plantain", city: "PH", requestType: "delivery", status: "completed", date: "2026-07-09" },
  { id: "l4", user: "Tunde Adebayo", restaurant: "Sizzling Pot", meal: "Suya Wrap", city: "Lagos", requestType: "pickup", status: "cancelled", date: "2026-07-08" },
];

export const samplePlans: AdminPlan[] = [
  { id: "p1", user: "Chidi Okafor", planType: "Solo", city: "Lagos", budget: "₦5,000/day", totalCost: 34000, totalCalories: 14200, date: "2026-07-11" },
  { id: "p2", user: "Amaka Ibe", planType: "Family (4)", city: "Abuja", budget: "₦12,000/day", totalCost: 78000, totalCalories: 56000, date: "2026-07-10" },
  { id: "p3", user: "Fatima Bello", planType: "Solo", city: "Kano", budget: "₦3,500/day", totalCost: 22400, totalCalories: 13800, date: "2026-07-08" },
];

export const sampleCities: AdminCity[] = [
  {
    id: "c1", state: "Lagos State", city: "Lagos", active: true,
    areas: [
      { id: "a1", name: "Ikeja", active: true },
      { id: "a2", name: "Lekki Phase 1", active: true },
      { id: "a3", name: "Victoria Island", active: true },
      { id: "a4", name: "Surulere", active: true },
      { id: "a5", name: "Yaba", active: true },
    ],
  },
  {
    id: "c2", state: "FCT", city: "Abuja", active: true,
    areas: [
      { id: "a10", name: "Wuse 2", active: true },
      { id: "a11", name: "Maitama", active: true },
      { id: "a12", name: "Gwarinpa", active: true },
      { id: "a13", name: "Jabi", active: true },
    ],
  },
  {
    id: "c3", state: "Rivers State", city: "Port Harcourt", active: true,
    areas: [{ id: "a20", name: "GRA", active: true }, { id: "a21", name: "D-Line", active: true }],
  },
  {
    id: "c4", state: "Imo State", city: "Owerri", active: false,
    areas: [{ id: "a30", name: "Ikenegbu", active: true }],
  },
];

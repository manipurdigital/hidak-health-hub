import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, Clock, Truck } from "lucide-react";

const PharmacySection = () => {
  const categories = [
    { name: "Diabetes Care", icon: "🩸", count: "500+ products" },
    { name: "Heart Care", icon: "❤️", count: "300+ products" },
    { name: "Women's Care", icon: "👩", count: "400+ products" },
    { name: "Baby Care", icon: "👶", count: "200+ products" },
    { name: "Vitamins", icon: "💊", count: "600+ products" },
    { name: "Pain Relief", icon: "🩹", count: "150+ products" }
  ];

  const featuredMedicines = [
    {
      name: "Paracetamol 500mg",
      brand: "Crocin",
      price: "₹24",
      originalPrice: "₹30",
      discount: "20% OFF",
      rating: 4.5,
      reviews: 1250,
      prescription: false,
      fastDelivery: true
    },
    {
      name: "Vitamin D3 Tablets",
      brand: "HealthVit",
      price: "₹185",
      originalPrice: "₹220",
      discount: "16% OFF",
      rating: 4.3,
      reviews: 890,
      prescription: false,
      fastDelivery: true
    },
    {
      name: "Metformin 500mg",
      brand: "Glycomet",
      price: "₹45",
      originalPrice: "₹52",
      discount: "13% OFF",
      rating: 4.6,
      reviews: 2100,
      prescription: true,
      fastDelivery: false
    },
    {
      name: "Calcium + Vitamin D",
      brand: "Shelcal",
      price: "₹135",
      originalPrice: "₹160",
      discount: "15% OFF",
      rating: 4.4,
      reviews: 1650,
      prescription: false,
      fastDelivery: true
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Online Pharmacy</h2>
            <p className="text-muted-foreground">Order medicines with prescription upload</p>
          </div>
          <Button variant="outline">View All Medicines</Button>
        </div>

        {/* Search and filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search for medicines, brands, or health conditions..."
                className="w-full pl-12 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="medical" size="lg">
              Upload Prescription
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Shop by Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                  <p className="text-xs text-muted-foreground">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured medicines */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Featured Medicines</h3>
            <Button variant="ghost">View All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMedicines.map((medicine, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={medicine.prescription ? "destructive" : "secondary"} className="text-xs">
                      {medicine.prescription ? "Prescription Required" : "No Prescription"}
                    </Badge>
                    {medicine.fastDelivery && (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <Truck className="w-3 h-3" />
                        Fast
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {medicine.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{medicine.brand}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{medicine.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({medicine.reviews} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{medicine.price}</span>
                      <span className="text-sm text-muted-foreground line-through">{medicine.originalPrice}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-success border-success">
                      {medicine.discount}
                    </Badge>
                  </div>

                  {/* Add to cart */}
                  <Button className="w-full group-hover:scale-105 transition-transform duration-200">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 bg-trust-badge p-8 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-semibold mb-1">100% Secure</h4>
              <p className="text-sm text-muted-foreground">Encrypted payments & data protection</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-semibold mb-1">Authentic Products</h4>
              <p className="text-sm text-muted-foreground">Licensed pharmacies & verified medicines</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🚚</div>
              <h4 className="font-semibold mb-1">Fast Delivery</h4>
              <p className="text-sm text-muted-foreground">Same day delivery in select cities</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PharmacySection;
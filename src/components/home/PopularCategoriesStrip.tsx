import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PopularCategoriesStrip = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: "fever-pain",
      name: "Fever & Pain",
      emoji: "🤒",
      color: "bg-red-50 hover:bg-red-100 border-red-200",
      textColor: "text-red-700"
    },
    {
      id: "vitamins",
      name: "Vitamins",
      emoji: "💊",
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
      textColor: "text-orange-700"
    },
    {
      id: "diabetes",
      name: "Diabetes Care",
      emoji: "🩺",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      textColor: "text-blue-700"
    },
    {
      id: "cold-cough",
      name: "Cold & Cough",
      emoji: "🤧",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      textColor: "text-green-700"
    },
    {
      id: "skin-care",
      name: "Skin Care",
      emoji: "✨",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      textColor: "text-purple-700"
    },
    {
      id: "baby-care",
      name: "Baby Care",
      emoji: "👶",
      color: "bg-pink-50 hover:bg-pink-100 border-pink-200",
      textColor: "text-pink-700"
    }
  ];

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/medicines?q=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Popular Categories</h2>
            <p className="text-muted-foreground">Shop by health condition</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/medicines")}>
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className={`group cursor-pointer transition-all duration-200 hover:-translate-y-1 ${category.color}`}
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {category.emoji}
                </div>
                <h3 className={`font-semibold text-sm ${category.textColor}`}>
                  {category.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
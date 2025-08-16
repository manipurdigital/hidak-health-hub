import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SearchResultPlaceholderProps {
  type: "medicines" | "doctors" | "lab-tests";
}

export function SearchResultPlaceholder({ type }: SearchResultPlaceholderProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const getTypeInfo = () => {
    switch (type) {
      case "medicines":
        return {
          title: "Medicine Details",
          description: "Medicine information and ordering will be available here.",
          icon: "💊"
        };
      case "doctors":
        return {
          title: "Doctor Profile",
          description: "Doctor information and consultation booking will be available here.",
          icon: "👨‍⚕️"
        };
      case "lab-tests":
        return {
          title: "Lab Test Details", 
          description: "Lab test information and booking will be available here.",
          icon: "🧪"
        };
    }
  };

  const info = getTypeInfo();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{info.icon}</div>
            <CardTitle className="text-2xl">{info.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {info.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Item ID: <code className="bg-muted px-2 py-1 rounded">{id}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              This is a placeholder page for development. The actual {type.slice(0, -1)} details page will be implemented later.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { ExportCodeButton } from "@/components/dev/ExportCodeButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Code, FileText, Image, Settings } from "lucide-react";

export default function AdminCodeExportPage() {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Codebase Export</h1>
          <p className="text-muted-foreground">
            Download the entire project codebase as a compressed archive
          </p>
        </div>

        {!isDevelopment && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Codebase export is only available in development mode for security reasons.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Export Options
            </CardTitle>
            <CardDescription>
              Generate a complete backup of your project files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDevelopment ? (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Included Files:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Source code (TypeScript, JavaScript)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Stylesheets (CSS, Tailwind)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span>Assets (images, icons)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Configuration files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Documentation (README, etc.)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <span>Supabase functions & migrations</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Excluded:</h3>
                  <div className="text-sm text-muted-foreground">
                    <span>node_modules, build artifacts, .git, environment secrets</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <ExportCodeButton />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Codebase export is disabled in production</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
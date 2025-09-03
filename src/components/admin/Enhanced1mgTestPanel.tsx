import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ParsedMedicine {
  name: string;
  salt_composition?: string;
  price: number;
  mrp?: number;
  discount_percent?: number;
  uses?: string;
  side_effects?: string;
  how_to_use?: string;
  how_it_works?: string;
  safety_advice?: string;
  manufacturer?: string;
  marketed_by?: string;
  therapeutic_class?: string;
  prescription_type?: string;
  substitute_available?: boolean;
  habit_forming?: boolean;
  image_url?: string;
  storage_conditions?: string;
  [key: string]: any;
}

export function Enhanced1mgTestPanel() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedMedicine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const testUrls = [
    'https://www.1mg.com/drugs/avastin-100mg-injection-135666',
    'https://www.1mg.com/drugs/paracetamol-500mg-tablet-89745',
    'https://www.1mg.com/drugs/crocin-advance-tablet-58888'
  ];

  const handleTest = async (testUrl?: string) => {
    const urlToTest = testUrl || url;
    if (!urlToTest) {
      toast({
        title: "Error",
        description: "Please enter a 1mg URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing enhanced 1mg parsing for:', urlToTest);
      
      const { data, error: parseError } = await supabase.functions.invoke('import-medicine-from-url', {
        body: {
          url: urlToTest,
          downloadImages: false,
          storeHtmlAudit: true
        }
      });

      if (parseError) {
        throw new Error(parseError.message || 'Failed to parse medicine');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to parse medicine data');
      }

      setResult(data.medicineData);
      
      toast({
        title: "Success",
        description: "Medicine data parsed successfully with enhanced 1mg logic",
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionScore = (medicine: ParsedMedicine) => {
    const fields = [
      'name', 'salt_composition', 'price', 'uses', 'side_effects', 
      'manufacturer', 'image_url', 'prescription_type'
    ];
    const filledFields = fields.filter(field => medicine[field] && medicine[field] !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const renderField = (label: string, value: any, isImportant = false) => {
    if (!value) return null;
    
    return (
      <div className={`p-3 rounded-lg ${isImportant ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-sm">{label}</h4>
          {isImportant && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
        <p className="text-sm text-muted-foreground break-words">
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
        </p>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Enhanced 1mg Parser Test Panel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the enhanced 1mg medicine data extraction with comprehensive field parsing
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter 1mg medicine URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleTest()} 
              disabled={loading || !url}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Parse'}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Test URLs:</p>
            <div className="flex flex-wrap gap-2">
              {testUrls.map((testUrl, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(testUrl)}
                  disabled={loading}
                  className="text-xs"
                >
                  Test {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Parsing Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Completion Score */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
              <div>
                <h3 className="font-semibold">Data Completion Score</h3>
                <p className="text-sm text-muted-foreground">
                  Percentage of key fields successfully extracted
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {getCompletionScore(result)}%
                </div>
                <Badge variant={getCompletionScore(result) >= 70 ? 'default' : 'secondary'}>
                  {getCompletionScore(result) >= 70 ? 'Good' : 'Needs Review'}
                </Badge>
              </div>
            </div>

            {/* Core Medicine Information */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded"></div>
                Core Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Medicine Name', result.name, true)}
                {renderField('Salt Composition', result.salt_composition, true)}
                {renderField('Price', result.price ? `₹${result.price}` : null)}
                {renderField('MRP', result.mrp ? `₹${result.mrp}` : null)}
                {renderField('Discount', result.discount_percent ? `${result.discount_percent}%` : null)}
                {renderField('Prescription Type', result.prescription_type)}
                {renderField('Manufacturer/Marketed by', result.marketed_by || result.manufacturer)}
                {renderField('Therapeutic Class', result.therapeutic_class)}
              </div>
            </div>

            <Separator />

            {/* Medical Information */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded"></div>
                Medical Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {renderField('Uses', result.uses, true)}
                {renderField('Side Effects', result.side_effects, true)}
                {renderField('How to Use', result.how_to_use)}
                {renderField('How it Works', result.how_it_works)}
                {renderField('Safety Advice', result.safety_advice)}
                {renderField('Storage Conditions', result.storage_conditions)}
              </div>
            </div>

            <Separator />

            {/* Product Details */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-green-500 rounded"></div>
                Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Pack Size', result.pack_size)}
                {renderField('Dosage Form', result.dosage_form)}
                {renderField('Dosage Strength', result.dosage_strength)}
                {renderField('Route of Administration', result.route_of_administration)}
                {renderField('Country of Origin', result.country_of_origin)}
                {renderField('Substitute Available', result.substitute_available)}
                {renderField('Habit Forming', result.habit_forming)}
              </div>
            </div>

            {/* Image Preview */}
            {result.image_url && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-500 rounded"></div>
                  Product Image
                </h3>
                <div className="flex items-center gap-4">
                  <img 
                    src={result.image_url} 
                    alt={result.name}
                    className="w-24 h-24 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">Image extracted successfully</p>
                    <p className="text-xs text-muted-foreground break-all">{result.image_url}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Data Preview */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-medium">
                View Raw Parsed Data
              </summary>
              <div className="p-4 border-t bg-muted/20">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useListPumps, getListPumpsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Star, Fuel } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function CustomerHome() {
  const [search, setSearch] = useState("");

  const { data: pumps, isLoading } = useListPumps({ search });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nearby Petrol Pumps</h1>
          <p className="text-muted-foreground mt-1">Find the best fuel prices and fastest delivery.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search pumps or location..." 
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      ) : pumps && pumps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pumps.map((pump) => (
            <Card key={pump.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all border-2 hover:border-primary/30">
              <CardHeader className="pb-4 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{pump.businessName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {pump.address}
                    </CardDescription>
                  </div>
                  {pump.averageRating ? (
                    <Badge variant="secondary" className="flex items-center gap-1 font-bold">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {pump.averageRating.toFixed(1)}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Range</span>
                    <span className="font-semibold">{pump.deliveryRadius} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Charges</span>
                    <span className="font-semibold">Rs {pump.deliveryCharges}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {pump.fuelPrices?.filter(f => f.isAvailable).map(fuel => (
                      <Badge key={fuel.id} variant="outline" className="bg-card">
                        {fuel.fuelType.replace('_', ' ')} • Rs {fuel.pricePerLiter}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button asChild className="w-full mt-auto" size="lg">
                  <Link href={`/customer/pump/${pump.id}`}>
                    <Fuel className="w-4 h-4 mr-2" /> Order Fuel
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/20 rounded-xl border border-dashed">
          <Fuel className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No pumps found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or location.</p>
        </div>
      )}
    </div>
  );
}
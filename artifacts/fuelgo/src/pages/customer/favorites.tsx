import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetCustomerFavorites, useRemoveFavoritePump, getGetCustomerFavoritesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, MapPin, Star } from "lucide-react";

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

export default function CustomerFavorites() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: favorites = [], isLoading } = useGetCustomerFavorites();
  const removeFavorite = useRemoveFavoritePump();

  const handleRemove = (pumpId: number) => {
    removeFavorite.mutate({ pumpId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCustomerFavoritesQueryKey() });
        toast({ title: "Removed from favorites" });
      },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/customer/home")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Favorite Pumps</h1>
      </div>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}

      {!isLoading && favorites.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground">Save pumps you love for quick access</p>
          <Button onClick={() => setLocation("/customer/home")} data-testid="button-find-pumps">Explore Pumps</Button>
        </div>
      )}

      <div className="space-y-3">
        {favorites.map(pump => (
          <Card key={pump.id} data-testid={`card-pump-${pump.id}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{pump.businessName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{pump.address}</p>
                  {pump.averageRating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">{pump.averageRating} ({pump.totalReviews} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pump.isOpen ? "default" : "secondary"} className="text-xs">{pump.isOpen ? "Open" : "Closed"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleRemove(pump.id)} data-testid={`button-remove-favorite-${pump.id}`}>
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {pump.fuelPrices?.filter(fp => fp.isAvailable).map(fp => (
                  <span key={fp.fuelType} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {FUEL_LABELS[fp.fuelType]} PKR {fp.pricePerLiter}
                  </span>
                ))}
              </div>
              <Button className="w-full" size="sm" onClick={() => setLocation(`/customer/pump/${pump.id}`)} data-testid={`button-view-pump-${pump.id}`}>
                Order Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

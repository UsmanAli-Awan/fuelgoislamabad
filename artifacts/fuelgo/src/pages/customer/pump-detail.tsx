import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetPump, useGetPumpReviews, useAddFavoritePump, useRemoveFavoritePump,
  useGetCustomerFavorites, useCreateOrder, getListOrdersQueryKey, getGetCustomerFavoritesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, Star, Heart, Fuel, Truck, ShoppingCart } from "lucide-react";

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

export default function CustomerPumpDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pumpId = parseInt(id, 10);

  const { data: pump, isLoading } = useGetPump(pumpId);
  const { data: reviews = [] } = useGetPumpReviews(pumpId);
  const { data: favorites = [] } = useGetCustomerFavorites();

  const isFavorited = favorites.some(f => f.id === pumpId);

  const addFavorite = useAddFavoritePump();
  const removeFavorite = useRemoveFavoritePump();
  const createOrder = useCreateOrder();

  const [ordering, setOrdering] = useState(false);
  const [fuelType, setFuelType] = useState("");
  const [quantity, setQuantity] = useState(5);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [notes, setNotes] = useState("");

  const toggleFavorite = () => {
    if (isFavorited) {
      removeFavorite.mutate({ pumpId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCustomerFavoritesQueryKey() });
          toast({ title: "Removed from favorites" });
        },
      });
    } else {
      addFavorite.mutate({ data: { pumpId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCustomerFavoritesQueryKey() });
          toast({ title: "Added to favorites" });
        },
      });
    }
  };

  const selectedFuel = pump?.fuelPrices?.find(fp => fp.fuelType === fuelType);
  const pricePerLiter = selectedFuel?.pricePerLiter || 0;
  const deliveryCharges = pump?.deliveryCharges || 0;
  const totalAmount = (pricePerLiter * quantity) + deliveryCharges;

  const handlePlaceOrder = () => {
    if (!fuelType || !quantity || !deliveryAddress) {
      toast({ title: "Missing Info", description: "Select fuel type, quantity and delivery address", variant: "destructive" });
      return;
    }
    createOrder.mutate(
      { data: { pumpId, fuelType, quantityLiters: quantity, deliveryAddress, notes: notes || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order Placed!", description: "Your fuel is on its way" });
          setLocation("/customer/orders");
        },
        onError: (err: any) => {
          toast({ title: "Order Failed", description: err?.data?.error || "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading pump details...</div>;
  if (!pump) return <div className="p-8 text-center text-muted-foreground">Pump not found</div>;

  const availableFuels = pump.fuelPrices?.filter(fp => fp.isAvailable) || [];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/customer/home")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleFavorite} data-testid="button-favorite">
          <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold" data-testid="text-pump-name">{pump.businessName}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{pump.address}</p>
            </div>
            <div className="text-right">
              {pump.averageRating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold text-sm">{pump.averageRating}</span>
                  <span className="text-muted-foreground text-xs">({pump.totalReviews})</span>
                </div>
              )}
              <Badge variant={pump.isOpen ? "default" : "secondary"} className="mt-1">{pump.isOpen ? "Open" : "Closed"}</Badge>
            </div>
          </div>

          {pump.operatingHoursStart && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {pump.operatingHoursStart} – {pump.operatingHoursEnd}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {pump.deliveryRadius} km radius</span>
            <span>PKR {pump.deliveryCharges} delivery</span>
          </div>

          {pump.description && <p className="text-sm text-muted-foreground border-t pt-2">{pump.description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Fuel className="w-4 h-4" /> Fuel Prices</CardTitle></CardHeader>
        <CardContent>
          {availableFuels.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fuel prices set</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableFuels.map(fp => (
                <div key={fp.fuelType} className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">{FUEL_LABELS[fp.fuelType]}</p>
                  <p className="font-bold text-primary">PKR {fp.pricePerLiter}</p>
                  <p className="text-xs text-muted-foreground">per liter</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!ordering ? (
        <Button className="w-full" size="lg" onClick={() => setOrdering(true)} disabled={!pump.isOpen || availableFuels.length === 0} data-testid="button-order-now">
          <ShoppingCart className="w-4 h-4 mr-2" />
          {pump.isOpen ? "Order Fuel" : "Pump is Closed"}
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Place Order</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Fuel Type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger data-testid="select-fuel-type">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {availableFuels.map(fp => (
                    <SelectItem key={fp.fuelType} value={fp.fuelType}>{FUEL_LABELS[fp.fuelType]} – PKR {fp.pricePerLiter}/L</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity (Liters)</Label>
              <Input type="number" min={1} max={200} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} data-testid="input-quantity" />
            </div>
            <div>
              <Label>Delivery Address</Label>
              <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Enter your delivery address" data-testid="input-delivery-address" />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." data-testid="input-notes" />
            </div>
            {fuelType && (
              <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>{FUEL_LABELS[fuelType]}</span><span>PKR {pricePerLiter} × {quantity}L</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>PKR {deliveryCharges}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>PKR {totalAmount.toFixed(2)}</span></div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOrdering(false)}>Cancel</Button>
              <Button className="flex-1" disabled={createOrder.isPending} onClick={handlePlaceOrder} data-testid="button-confirm-order">
                {createOrder.isPending ? "Placing..." : "Confirm Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4" /> Reviews ({reviews.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {reviews.slice(0, 5).map(review => (
              <div key={review.id} className="border-b last:border-0 pb-2 last:pb-0" data-testid={`review-${review.id}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{review.customerName || "Customer"}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

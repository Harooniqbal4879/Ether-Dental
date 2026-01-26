import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, Phone, Globe, CheckCircle, Search, X, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsuranceCarrier, PracticeInsuranceCarrier, Practice } from "@shared/schema";

type PracticeInsuranceCarrierWithCarrier = PracticeInsuranceCarrier & { carrier: InsuranceCarrier };

export default function Carriers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [carrierSearch, setCarrierSearch] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<InsuranceCarrier | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: practices } = useQuery<Practice[]>({
    queryKey: ["/api/practices"],
  });

  const practiceId = practices?.[0]?.id;

  const { data: practiceCarriers, isLoading } = useQuery<PracticeInsuranceCarrierWithCarrier[]>({
    queryKey: ["/api/practices", practiceId, "insurance-carriers"],
    queryFn: async () => {
      if (!practiceId) return [];
      const response = await fetch(`/api/practices/${practiceId}/insurance-carriers`);
      if (!response.ok) throw new Error("Failed to fetch carriers");
      return response.json();
    },
    enabled: !!practiceId,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery<InsuranceCarrier[]>({
    queryKey: ["/api/carriers/search", carrierSearch],
    queryFn: async () => {
      if (carrierSearch.length < 2) return [];
      const response = await fetch(`/api/carriers/search?q=${encodeURIComponent(carrierSearch)}`);
      if (!response.ok) throw new Error("Failed to search carriers");
      return response.json();
    },
    enabled: carrierSearch.length >= 2,
  });

  const addCarrierMutation = useMutation({
    mutationFn: async (carrierId: string) => {
      return apiRequest("POST", `/api/practices/${practiceId}/insurance-carriers`, { carrierId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "insurance-carriers"] });
      toast({
        title: "Carrier added",
        description: "The insurance carrier has been added to your practice.",
      });
      setIsDialogOpen(false);
      setSelectedCarrier(null);
      setCarrierSearch("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add carrier. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeCarrierMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/practices/${practiceId}/insurance-carriers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practices", practiceId, "insurance-carriers"] });
      toast({
        title: "Carrier removed",
        description: "The insurance carrier has been removed from your practice.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove carrier. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedCarrier(null);
      setCarrierSearch("");
      setShowSearchResults(false);
    }
  }, [isDialogOpen]);

  const handleSelectCarrier = (carrier: InsuranceCarrier) => {
    setSelectedCarrier(carrier);
    setCarrierSearch(carrier.name);
    setShowSearchResults(false);
  };

  const handleClearSelection = () => {
    setSelectedCarrier(null);
    setCarrierSearch("");
    searchInputRef.current?.focus();
  };

  const handleAddCarrier = () => {
    if (selectedCarrier) {
      addCarrierMutation.mutate(selectedCarrier.id);
    }
  };

  const filteredPracticeCarriers = practiceCarriers?.filter((pc) =>
    pc.carrier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!practiceId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="No practice selected"
          description="Please select a practice to manage insurance carriers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Insurance Carriers"
        description="Manage accepted insurance carriers for your practice"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-carrier">
                <Plus className="mr-2 h-4 w-4" />
                Add Carrier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Insurance Carrier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier-search">Carrier Name *</Label>
                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      id="carrier-search"
                      placeholder="Search for a carrier..."
                      value={carrierSearch}
                      onChange={(e) => {
                        setCarrierSearch(e.target.value);
                        setShowSearchResults(true);
                        if (selectedCarrier && e.target.value !== selectedCarrier.name) {
                          setSelectedCarrier(null);
                        }
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      className={selectedCarrier ? "pr-8" : ""}
                      data-testid="input-carrier-search"
                    />
                    {selectedCarrier && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-carrier"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {showSearchResults && carrierSearch.length >= 2 && !selectedCarrier && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                        {isSearching ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm">Searching...</span>
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          <ul className="max-h-60 overflow-auto py-1">
                            {searchResults.map((carrier) => (
                              <li key={carrier.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectCarrier(carrier)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                                  data-testid={`option-carrier-${carrier.id}`}
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                                    {carrier.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{carrier.name}</div>
                                    {carrier.phone && (
                                      <div className="truncate text-xs text-muted-foreground">
                                        {carrier.phone}
                                      </div>
                                    )}
                                  </div>
                                  {carrier.clearinghouseCompatible && (
                                    <Badge variant="outline" className="shrink-0 text-xs">EDI</Badge>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No carriers found matching "{carrierSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Search and select from our database of insurance carriers
                  </p>
                </div>

                {selectedCarrier && (
                  <>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={selectedCarrier.phone || "N/A"}
                        disabled
                        className="bg-muted"
                        data-testid="input-carrier-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={selectedCarrier.website || "N/A"}
                        disabled
                        className="bg-muted"
                        data-testid="input-carrier-website"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <Label className="text-base">Clearinghouse Compatible</Label>
                        <p className="text-sm text-muted-foreground">
                          Can verify through electronic clearinghouse
                        </p>
                      </div>
                      <Switch
                        checked={selectedCarrier.clearinghouseCompatible || false}
                        disabled
                        data-testid="switch-clearinghouse"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCarrier}
                    disabled={!selectedCarrier || addCarrierMutation.isPending}
                    data-testid="button-submit-carrier"
                  >
                    {addCarrierMutation.isPending ? "Adding..." : "Add Carrier"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search carriers..."
          className="pl-9"
          data-testid="input-search-carriers"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPracticeCarriers && filteredPracticeCarriers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPracticeCarriers.map((pc) => (
            <Card key={pc.id} className="hover-elevate group" data-testid={`card-carrier-${pc.carrier.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg font-semibold">
                    {pc.carrier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{pc.carrier.name}</h3>
                      {pc.carrier.clearinghouseCompatible && (
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                          <CheckCircle className="h-3 w-3" />
                          EDI
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {pc.carrier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{pc.carrier.phone}</span>
                        </div>
                      )}
                      {pc.carrier.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5" />
                          <a
                            href={pc.carrier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:underline"
                          >
                            {pc.carrier.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="invisible shrink-0 group-hover:visible"
                    onClick={() => removeCarrierMutation.mutate(pc.id)}
                    disabled={removeCarrierMutation.isPending}
                    data-testid={`button-remove-carrier-${pc.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "No carriers found" : "No carriers yet"}
          description={
            searchQuery
              ? "Try adjusting your search"
              : "Add insurance carriers to start verifying patient benefits"
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Carrier
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

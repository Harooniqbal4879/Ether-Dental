import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Clock, DollarSign, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StaffShift, Professional } from "@shared/schema";

interface ShiftInviteModalProps {
  shift: StaffShift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftInviteModal({ shift, open, onOpenChange }: ShiftInviteModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);

  const { data: professionals = [], isLoading } = useQuery<Professional[]>({
    queryKey: ["/api/professionals", { role: shift.role }],
    enabled: open,
  });

  const filteredProfessionals = professionals.filter(
    (p) => p.role === shift.role && p.isActive
  );

  const sendInvitesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shifts/invite", {
        shiftId: shift.id,
        professionalIds: selectedProfessionals,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations sent",
        description: `Successfully sent ${data.invitesSent} invitation${data.invitesSent !== 1 ? "s" : ""} to bid on this shift.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/conversations"] });
      setSelectedProfessionals([]);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProfessionals.length === filteredProfessionals.length) {
      setSelectedProfessionals([]);
    } else {
      setSelectedProfessionals(filteredProfessionals.map((p) => p.id));
    }
  };

  const handleSendInvites = () => {
    if (selectedProfessionals.length === 0) {
      toast({
        title: "No professionals selected",
        description: "Please select at least one professional to invite.",
        variant: "destructive",
      });
      return;
    }
    sendInvitesMutation.mutate();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatShiftRate = () => {
    if (shift.pricingMode === "fixed" && shift.fixedHourlyRate) {
      return `$${parseFloat(shift.fixedHourlyRate).toFixed(2)}/hr`;
    }
    if (shift.pricingMode === "smart" && shift.minHourlyRate && shift.maxHourlyRate) {
      return `$${parseFloat(shift.minHourlyRate).toFixed(2)} - $${parseFloat(shift.maxHourlyRate).toFixed(2)}/hr`;
    }
    return "Rate TBD";
  };

  const formattedDate = format(new Date(shift.date + "T00:00:00"), "EEEE, MMMM d, yyyy");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" data-testid="dialog-shift-invite">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Invite Professionals to Bid
          </DialogTitle>
          <DialogDescription>
            Send invitation messages to selected professionals for this shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{shift.arrivalTime} - {shift.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{formatShiftRate()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{shift.role}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">
            Select {shift.role}s to invite
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            data-testid="button-select-all"
          >
            {selectedProfessionals.length === filteredProfessionals.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>

        <ScrollArea className="flex-1 max-h-[300px] border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {shift.role}s available to invite</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredProfessionals.map((professional) => (
                <label
                  key={professional.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                  data-testid={`professional-item-${professional.id}`}
                >
                  <Checkbox
                    checked={selectedProfessionals.includes(professional.id)}
                    onCheckedChange={() => handleToggleProfessional(professional.id)}
                    data-testid={`checkbox-professional-${professional.id}`}
                  />
                  <Avatar className="h-10 w-10">
                    {professional.photoUrl && (
                      <AvatarImage src={professional.photoUrl} />
                    )}
                    <AvatarFallback>
                      {getInitials(professional.firstName, professional.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {professional.firstName} {professional.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {professional.role}
                      {professional.rating && ` • ${professional.rating} rating`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-invite"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvites}
            disabled={selectedProfessionals.length === 0 || sendInvitesMutation.isPending}
            data-testid="button-send-invites"
          >
            <Send className="h-4 w-4 mr-2" />
            Send {selectedProfessionals.length > 0 ? `${selectedProfessionals.length} ` : ""}
            Invite{selectedProfessionals.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  user: {
    name: string | null;
  };
  customer?: {
    name: string;
  };
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "customer_created":
        return "👤";
      case "invoice_created":
        return "📄";
      case "invoice_paid":
        return "✅";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "customer_created":
        return "bg-blue-100 text-blue-600";
      case "invoice_created":
        return "bg-yellow-100 text-yellow-600";
      case "invoice_paid":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activities
              </p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={getActivityColor(activity.type)}>
                        {getActivityIcon(activity.type)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.user?.name || "Unknown user"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                      {activity.customer && (
                        <span className="font-medium"> - {activity.customer.name}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
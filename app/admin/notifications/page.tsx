"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare } from "lucide-react"
import type { Notification } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NotificationsPage() {
  const { data } = useSWR("/api/admin/notifications", fetcher)
  const notifications: Notification[] = data?.notifications || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Track email and SMS notifications sent to candidates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email Notifications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {notifications.filter((n) => n.type === "email").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total emails sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SMS Notifications</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {notifications.filter((n) => n.type === "sms").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total SMS sent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Notification Log</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No notifications sent yet</p>
              <p className="text-sm text-muted-foreground">Notifications are sent automatically when certificates are generated</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n._id}>
                      <TableCell>
                        {n.type === "email" ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>SMS</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{n.recipient_email || n.recipient_mobile || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{n.cert_code}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{n.candidate_name}</TableCell>
                      <TableCell>
                        <Badge variant={n.status === "sent" ? "default" : "secondary"}>
                          {n.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(n.sent_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

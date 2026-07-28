// components/ShowcaseComponent/TabsShowcase.tsx
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TabsShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tabs</h3>
      <p className="text-sm text-muted-foreground">
        A set of layered sections of content—known as tab panels—that are displayed one at a time.
      </p>
      
      <div className="space-y-8">
        {/* Basic Tabs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic</h4>
          <Tabs defaultValue="account" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Make changes to your account here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue="@johndoe" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Multiple Tabs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Tabs</h4>
          <Tabs defaultValue="overview" className="w-full max-w-2xl">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-4 border rounded-lg mt-2">
              <p className="text-sm text-muted-foreground">
                Overview content goes here. This is where you&apos;d show a summary of all data.
              </p>
            </TabsContent>
            <TabsContent value="analytics" className="p-4 border rounded-lg mt-2">
              <p className="text-sm text-muted-foreground">
                Analytics content goes here. Charts and graphs would be displayed.
              </p>
            </TabsContent>
            <TabsContent value="reports" className="p-4 border rounded-lg mt-2">
              <p className="text-sm text-muted-foreground">
                Reports content goes here. Downloadable reports and data exports.
              </p>
            </TabsContent>
            <TabsContent value="settings" className="p-4 border rounded-lg mt-2">
              <p className="text-sm text-muted-foreground">
                Settings content goes here. Configure your dashboard preferences.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Disabled Tab */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Disabled Tab</h4>
          <Tabs defaultValue="tab1" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">Active</TabsTrigger>
              <TabsTrigger value="tab2">Also Active</TabsTrigger>
              <TabsTrigger value="tab3" disabled>Disabled</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
              <p className="text-sm">First tab content</p>
            </TabsContent>
            <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
              <p className="text-sm">Second tab content</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
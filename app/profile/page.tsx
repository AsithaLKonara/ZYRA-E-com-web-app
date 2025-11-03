'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clientLogger } from '@/lib/client-logger';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  ShoppingBag,
  Heart,
  Settings,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderHistory } from '@/components/profile/order-history';
import { WishlistSection } from '@/components/profile/wishlist-section';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateJoined: string;
  lastLogin: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
  }>;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    preferences: {
      newsletter: false,
      smsNotifications: false,
      emailNotifications: true,
    },
  });

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchOrders();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US',
          },
          preferences: profileData.preferences || {
            newsletter: false,
            smsNotifications: false,
            emailNotifications: true,
          },
        });
      }
    } catch (error) {
      clientLogger.error('Failed to fetch profile', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData.slice(0, 5)); // Show only recent orders
      }
    } catch (error) {
      clientLogger.error('Failed to fetch orders', {}, error instanceof Error ? error : undefined);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof typeof prev;
        const parentData = (prev[parentKey] as any) || {};
        return {
          ...prev,
          [parentKey]: {
            ...parentData,
            [child as any]: value,
          },
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Please sign in to view your profile
          </p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    {profile?.image ? (
                      <img
                        src={profile.image}
                        alt={profile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-600">
                        {profile?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{profile?.name}</h3>
                  <p className="text-gray-600">{profile?.email}</p>
                  <Badge className="mt-2">
                    {profile?.role}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Joined {formatDate(profile?.dateJoined || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span>Last login {formatDate(profile?.lastLogin || '')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label>Address</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Input
                          placeholder="Street Address"
                          value={formData.address.street}
                          onChange={(e) => handleInputChange('address.street', e.target.value)}
                          disabled={!isEditing}
                        />
                        <Input
                          placeholder="City"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          disabled={!isEditing}
                        />
                        <Input
                          placeholder="State"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          disabled={!isEditing}
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-6">
                <OrderHistory userId={profile?.id || ''} />
              </TabsContent>

              {/* Wishlist Tab */}
              <TabsContent value="wishlist" className="mt-6">
                <WishlistSection userId={profile?.id || ''} />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive updates about your orders and promotions
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.preferences.emailNotifications}
                          onChange={(e) => handleInputChange('preferences.emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Newsletter</p>
                          <p className="text-sm text-gray-600">
                            Subscribe to our newsletter for updates and special offers
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.preferences.newsletter}
                          onChange={(e) => handleInputChange('preferences.newsletter', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-gray-600">
                            Receive text messages about important updates
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.preferences.smsNotifications}
                          onChange={(e) => handleInputChange('preferences.smsNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-red-600">Danger Zone</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                          Change Password
                        </Button>
                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
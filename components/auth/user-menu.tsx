'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { clientLogger } from '@/lib/client-logger';
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Heart, 
  LogOut, 
  Package, 
  BarChart3,
  Shield
} from 'lucide-react';

interface UserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      clientLogger.error('Sign out failed', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary" className="text-xs">Moderator</Badge>;
      default:
        return null;
    }
  };

  const isAdmin = user.role === 'ADMIN';
  const isModerator = user.role === 'MODERATOR' || isAdmin;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {getRoleBadge(user.role)}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Profile & Settings */}
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push('/profile/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Shopping */}
        <DropdownMenuItem onClick={() => router.push('/orders')}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push('/wishlist')}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Wishlist</span>
        </DropdownMenuItem>
        
        {/* Admin/Moderator Options */}
        {isModerator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">
              {isAdmin ? 'Admin' : 'Moderator'} Tools
            </DropdownMenuLabel>
            
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => router.push('/admin/products')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Manage Products</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/admin/orders')}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Manage Orders</span>
            </DropdownMenuItem>
            
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
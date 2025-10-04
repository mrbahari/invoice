'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/context/user-context';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';

export function UserNav() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="w-24 h-8 bg-muted rounded-md animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">ورود</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signup">ثبت نام</Link>
        </Button>
      </div>
    );
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return '..';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.photoURL ?? `https://avatar.vercel.sh/${user.uid}.png`}
              alt={user.displayName ?? 'User Avatar'}
            />
            <AvatarFallback>
              {getInitials(user.displayName, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName ?? 'کاربر مهمان'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email ?? 'ایمیل ثبت نشده'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            پروفایل
          </DropdownMenuItem>
          <DropdownMenuItem>
            تنظیمات
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button type="submit" className="w-full">
            <DropdownMenuItem>
              خروج
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

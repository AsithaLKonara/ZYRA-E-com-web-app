import React from 'react';
import { 
  AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle, Eye, EyeOff, Lock, LogIn, Mail, User, X, Loader2,
  Plus, Minus, Search, ShoppingCart, Heart, Share2, MessageCircle, Play, Pause, Volume2, VolumeX, Settings, Menu,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star, StarHalf, Filter, SortAsc, SortDesc, Calendar, Clock,
  MapPin, Phone, Globe, Facebook, Instagram, Twitter, Youtube, Github, Linkedin, ExternalLink, Download, Upload,
  Edit, Trash2, Copy, Save, RefreshCw, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize, Grid, List, Layout,
  Sidebar, MoreHorizontal, MoreVertical, Flag, Bookmark, Tag, Hash, AtSign, DollarSign, CreditCard, Wallet, Package,
  Truck, Home, Building, Map, Navigation, Compass, Target, Zap, Shield, Key, Fingerprint, Smartphone, Monitor, Tablet,
  Laptop, Headphones, Camera, Mic, MicOff, Video, VideoOff, Image, File, FileText, Folder, FolderOpen, Archive, Inbox,
  Send, Reply, Forward, ReplyAll, Trash, ArchiveRestore, Pin, PinOff, Bell, BellOff, BellRing, Moon, Sun, Cloud, CloudRain,
  CloudSnow, CloudLightning, Wind, Droplets, Thermometer, Umbrella, Sunrise, Sunset, Activity, BarChart3, TrendingUp,
  TrendingDown, LineChart, PieChart, Euro, PoundSterling, JapaneseYen, IndianRupee, Bitcoin, Receipt, Calculator, Percent,
  ArrowUp, ArrowDown, ArrowUpDown, ArrowLeftRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Move, MoveUp,
  MoveDown, MoveLeft, MoveRight, History, Timer, Hourglass, CalendarDays, CalendarCheck, CalendarX, CalendarPlus, CalendarMinus,
  CalendarRange, CalendarSearch, CalendarHeart, LucideIcon 
} from 'lucide-react';

// Custom Google icon component
export const GoogleIcon = ({ className, size = 24, ...props }: { className?: string; size?: number; [key: string]: any }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Re-export commonly used icons from lucide-react
export {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  User,
  X,
  Loader2,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Menu,
  X as Close,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  ExternalLink,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid,
  List,
  Layout,
  Sidebar,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Wallet,
  Package,
  Truck,
  Home,
  Building,
  Map,
  Navigation,
  Compass,
  Target,
  Zap,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Headphones,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  File,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  ReplyAll,
  Trash,
  ArchiveRestore,
  Pin,
  PinOff,
  Bell,
  BellOff,
  BellRing,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Sunrise,
  Sunset,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  DollarSign as Dollar,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee,
  Bitcoin,
  CreditCard as Card,
  Wallet as WalletIcon,
  Receipt,
  Calculator,
  Percent,
  TrendingUp as Growth,
  TrendingDown as Decline,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Move,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RotateCcw as Undo,
  RotateCw as Redo,
  History,
  Clock as Time,
  Timer,
  Hourglass,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  Star as CalendarStar,
  Calendar as Event,
  Calendar as EventIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Timer as StopwatchIcon,
  Hourglass as HourglassIcon,
  type LucideIcon as IconType,
} from 'lucide-react';

// Create a type for icon names
export type IconName = 
  | 'alert-circle'
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'check-circle'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'mail'
  | 'user'
  | 'x'
  | 'loader2'
  | 'plus'
  | 'minus'
  | 'search'
  | 'shopping-cart'
  | 'heart'
  | 'share2'
  | 'message-circle'
  | 'play'
  | 'pause'
  | 'volume2'
  | 'volume-x'
  | 'settings'
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'star'
  | 'star-half'
  | 'filter'
  | 'sort-asc'
  | 'sort-desc'
  | 'calendar'
  | 'clock'
  | 'map-pin'
  | 'phone'
  | 'globe'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'github'
  | 'linkedin'
  | 'external-link'
  | 'download'
  | 'upload'
  | 'edit'
  | 'trash2'
  | 'copy'
  | 'save'
  | 'refresh-cw'
  | 'rotate-ccw'
  | 'rotate-cw'
  | 'zoom-in'
  | 'zoom-out'
  | 'maximize'
  | 'minimize'
  | 'grid'
  | 'list'
  | 'layout'
  | 'sidebar'
  | 'more-horizontal'
  | 'more-vertical'
  | 'flag'
  | 'bookmark'
  | 'tag'
  | 'hash'
  | 'at-sign'
  | 'dollar-sign'
  | 'credit-card'
  | 'wallet'
  | 'package'
  | 'truck'
  | 'home'
  | 'building'
  | 'map'
  | 'navigation'
  | 'compass'
  | 'target'
  | 'zap'
  | 'shield'
  | 'key'
  | 'fingerprint'
  | 'smartphone'
  | 'monitor'
  | 'tablet'
  | 'laptop'
  | 'headphones'
  | 'camera'
  | 'mic'
  | 'mic-off'
  | 'video'
  | 'video-off'
  | 'image'
  | 'file'
  | 'file-text'
  | 'folder'
  | 'folder-open'
  | 'archive'
  | 'inbox'
  | 'send'
  | 'reply'
  | 'forward'
  | 'reply-all'
  | 'trash'
  | 'archive-restore'
  | 'pin'
  | 'pin-off'
  | 'bell'
  | 'bell-off'
  | 'bell-ring'
  | 'moon'
  | 'sun'
  | 'cloud'
  | 'cloud-rain'
  | 'cloud-snow'
  | 'cloud-lightning'
  | 'wind'
  | 'droplets'
  | 'thermometer'
  | 'umbrella'
  | 'sunrise'
  | 'sunset'
  | 'activity'
  | 'bar-chart3'
  | 'trending-up'
  | 'trending-down'
  | 'line-chart'
  | 'pie-chart'
  | 'dollar'
  | 'euro'
  | 'pound-sterling'
  | 'yen'
  | 'indian-rupee'
  | 'bitcoin'
  | 'card'
  | 'wallet-icon'
  | 'receipt'
  | 'calculator'
  | 'percent'
  | 'growth'
  | 'decline'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-up-down'
  | 'arrow-left-right'
  | 'arrow-up-left'
  | 'arrow-up-right'
  | 'arrow-down-left'
  | 'arrow-down-right'
  | 'move'
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'undo'
  | 'redo'
  | 'history'
  | 'time'
  | 'timer'
  | 'stopwatch'
  | 'hourglass'
  | 'calendar-icon'
  | 'calendar-days'
  | 'calendar-check'
  | 'calendar-x'
  | 'calendar-plus'
  | 'calendar-minus'
  | 'calendar-range'
  | 'calendar-search'
  | 'calendar-heart'
  | 'calendar-star'
  | 'event'
  | 'event-icon'
  | 'clock-icon'
  | 'timer-icon'
  | 'stopwatch-icon'
  | 'hourglass-icon';

// Icon mapping object
export const iconMap: Record<IconName, LucideIcon> = {
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'check': Check,
  'check-circle': CheckCircle,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'mail': Mail,
  'user': User,
  'x': X,
  'loader2': Loader2,
  'plus': Plus,
  'minus': Minus,
  'search': Search,
  'shopping-cart': ShoppingCart,
  'heart': Heart,
  'share2': Share2,
  'message-circle': MessageCircle,
  'play': Play,
  'pause': Pause,
  'volume2': Volume2,
  'volume-x': VolumeX,
  'settings': Settings,
  'menu': Menu,
  'close': X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'star': Star,
  'star-half': StarHalf,
  'filter': Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  'calendar': Calendar,
  'clock': Clock,
  'map-pin': MapPin,
  'phone': Phone,
  'globe': Globe,
  'facebook': Facebook,
  'instagram': Instagram,
  'twitter': Twitter,
  'youtube': Youtube,
  'github': Github,
  'linkedin': Linkedin,
  'external-link': ExternalLink,
  'download': Download,
  'upload': Upload,
  'edit': Edit,
  'trash2': Trash2,
  'copy': Copy,
  'save': Save,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  'maximize': Maximize,
  'minimize': Minimize,
  'grid': Grid,
  'list': List,
  'layout': Layout,
  'sidebar': Sidebar,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'flag': Flag,
  'bookmark': Bookmark,
  'tag': Tag,
  'hash': Hash,
  'at-sign': AtSign,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'package': Package,
  'truck': Truck,
  'home': Home,
  'building': Building,
  'map': Map,
  'navigation': Navigation,
  'compass': Compass,
  'target': Target,
  'zap': Zap,
  'shield': Shield,
  'key': Key,
  'fingerprint': Fingerprint,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'tablet': Tablet,
  'laptop': Laptop,
  'headphones': Headphones,
  'camera': Camera,
  'mic': Mic,
  'mic-off': MicOff,
  'video': Video,
  'video-off': VideoOff,
  'image': Image,
  'file': File,
  'file-text': FileText,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'inbox': Inbox,
  'send': Send,
  'reply': Reply,
  'forward': Forward,
  'reply-all': ReplyAll,
  'trash': Trash,
  'archive-restore': ArchiveRestore,
  'pin': Pin,
  'pin-off': PinOff,
  'bell': Bell,
  'bell-off': BellOff,
  'bell-ring': BellRing,
  'moon': Moon,
  'sun': Sun,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'wind': Wind,
  'droplets': Droplets,
  'thermometer': Thermometer,
  'umbrella': Umbrella,
  'sunrise': Sunrise,
  'sunset': Sunset,
  'activity': Activity,
  'bar-chart3': BarChart3,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'dollar': DollarSign,
  'euro': Euro,
  'pound-sterling': PoundSterling,
  'yen': JapaneseYen,
  'indian-rupee': IndianRupee,
  'bitcoin': Bitcoin,
  'card': CreditCard,
  'wallet-icon': Wallet,
  'receipt': Receipt,
  'calculator': Calculator,
  'percent': Percent,
  'growth': TrendingUp,
  'decline': TrendingDown,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-down': ArrowUpDown,
  'arrow-left-right': ArrowLeftRight,
  'arrow-up-left': ArrowUpLeft,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-left': ArrowDownLeft,
  'arrow-down-right': ArrowDownRight,
  'move': Move,
  'move-up': MoveUp,
  'move-down': MoveDown,
  'move-left': MoveLeft,
  'move-right': MoveRight,
  'undo': RotateCcw,
  'redo': RotateCw,
  'history': History,
  'time': Clock,
  'timer': Timer,
  'stopwatch': Timer,
  'hourglass': Hourglass,
  'calendar-icon': Calendar,
  'calendar-days': CalendarDays,
  'calendar-check': CalendarCheck,
  'calendar-x': CalendarX,
  'calendar-plus': CalendarPlus,
  'calendar-minus': CalendarMinus,
  'calendar-range': CalendarRange,
  'calendar-search': CalendarSearch,
  'calendar-heart': CalendarHeart,
  'calendar-star': Star,
  'event': Calendar,
  'event-icon': Calendar,
  'clock-icon': Clock,
  'timer-icon': Timer,
  'stopwatch-icon': Timer,
  'hourglass-icon': Hourglass,
};

// Dynamic icon component
export interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: any;
}

export function Icon({ name, size = 24, className = '', color, strokeWidth = 2, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    // Use clientLogger only if available (component may be used server-side)
    if (typeof window !== 'undefined') {
      const { clientLogger } = require('@/lib/client-logger');
      clientLogger.warn(`Icon "${name}" not found`, { iconName: name });
    }
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}

// Convenience exports for commonly used icons
export const Icons = {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  User,
  X,
  Loader2,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Menu,
  Close: X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Google: GoogleIcon,
  Linkedin,
  ExternalLink,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid,
  List,
  Layout,
  Sidebar,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  CreditCard,
  Wallet,
  Package,
  Truck,
  Home,
  Building,
  Map,
  Navigation,
  Compass,
  Target,
  Zap,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Headphones,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  File,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  ReplyAll,
  Trash,
  ArchiveRestore,
  Pin,
  PinOff,
  Bell,
  BellOff,
  BellRing,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Sunrise,
  Sunset,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  Dollar: DollarSign,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee,
  Bitcoin,
  Card: CreditCard,
  WalletIcon: Wallet,
  Receipt,
  Calculator,
  Percent,
  Growth: TrendingUp,
  Decline: TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Move,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  Undo: RotateCcw,
  Redo: RotateCw,
  History,
  Time: Clock,
  Timer,
  Hourglass,
  CalendarIcon: Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar: Star,
  Event: Calendar,
  EventIcon: Calendar,
  ClockIcon: Clock,
  TimerIcon: Timer,
  StopwatchIcon: Timer,
  HourglassIcon: Hourglass,
};

export default Icon;

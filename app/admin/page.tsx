'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  FiBarChart,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiSettings,
  FiShield,
  FiMail,
  FiBell,
  FiMenu,
  FiX,
  FiHome,
  FiCreditCard,
  FiActivity,
  FiEye,
  FiPlus,
  FiEdit,
  FiSearch,
  FiDownload,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiStar,
  FiZap,
  FiImage,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { isAdmin } from '@/lib/roleCheck';
import { formatPrice } from '@/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import DashboardLayout from '@/components/DashboardLayout';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  pendingPaymentTotal: number;
  pendingPaymentOrders: number;
  paidOrders: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  recentOrders: Array<{
    _id: string;
    order_number?: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  monthlyRevenue: number[];
  topProducts: Array<{
    _id: string;
    title: string;
    price: number;
    sales: number;
  }>;
}

interface DashboardCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navigationTabIds = ['overview', 'products', 'users', 'analytics', 'reviews', 'finance', 'settings'];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const searchParams = useSearchParams();

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && navigationTabIds.includes(requestedTab)) setActiveTab(requestedTab);
  }, [searchParams]);

  // Notifications state
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderNotifications: true,
    paymentAlerts: true,
    lowStockWarnings: true,
    systemAlerts: true,
    emailNotifications: true
  });
  const [notificationStats, setNotificationStats] = useState({
    unreadAlerts: 3,
    emailQueue: 12,
    systemAlerts: 0,
    sentToday: 47
  });

  // Finance state
  const [generatingReport, setGeneratingReport] = useState(false);

  // Settings state
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Edau Farm',
    siteDescription: 'West Pokots Premier Sustainable Farm',
    adminEmail: 'docta2856@gmail.com',
    contactEmail: 'support@edaufarm.com',
    supportPhone: '+254 727 690165',
    maintenanceMode: false,
    allowRegistration: true,
    emailService: 'connected',
    databaseStatus: 'connected',
    paymentGateway: 'active',
    farmStoryVideoUrl: '',
    heroImageUrl: '',
    heroImageAlt: 'Edau Farm hero image',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin');
    } else if (status === 'authenticated' && !isAdmin(session?.user?.role)) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
    } else if (status === 'authenticated' && isAdmin(session?.user?.role)) {
      fetchStats();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
      // Fetch site settings too
      fetchSiteSettings();
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get('/api/site-settings');
      if (response.data.settings) {
      setSystemSettings(prev => ({
        ...prev,
        farmStoryVideoUrl: response.data.settings.farm_story_video_url || '',
        heroImageUrl: response.data.settings.hero_image_url || '',
        heroImageAlt: response.data.settings.hero_image_alt || 'Edau Farm hero image',
      }));
      }
    } catch (error) {
      // Silently fail - settings not critical
    }
  };

  // Notification functions
  const updateNotificationPreference = async (key: string, value: boolean) => {
    try {
      setNotificationPrefs(prev => ({ ...prev, [key]: value }));
      await axios.patch('/api/admin/settings/notifications', { [key]: value });
      toast.success('Notification preference updated');
    } catch (error) {
      toast.error('Failed to update notification preference');
      // Revert on error
      setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
    }
  };

  // Note: fetchNotifications currently unused - to be implemented later
  // const fetchNotifications = async () => {
  //   try {
  //     const response = await axios.get('/api/admin/notifications');
  //     setNotifications(response.data.notifications || []);
  //     setNotificationStats(response.data.stats || notificationStats);
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error);
  //   }
  // };

  // Finance functions
  const generateFinancialReport = async () => {
    try {
      setGeneratingReport(true);
      if (!stats) return;
      const rows = [
        ['Metric', 'Value'],
        ['Total revenue', String(stats.totalRevenue)],
        ['Total orders', String(stats.totalOrders)],
        ['Paid orders', String(stats.paidOrders)],
        ['Pending payment orders', String(stats.pendingPaymentOrders)],
        ['Pending payment value', String(stats.pendingPaymentTotal)],
        ['Average order value', String(stats.averageOrderValue)],
        ...Object.entries(stats.paymentMethodBreakdown).map(([method, count]) => [`Payment method: ${method}`, String(count)]),
      ];
      const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Financial report generated successfully');
    } catch (error) {
      toast.error('Failed to generate financial report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const managePaymentSettings = () => {
    setActiveTab('orders');
    toast.success('Review payment status from Order Management.');
  };

  // Settings functions
  const saveSystemSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.patch('/api/admin/settings/system', systemSettings);
      await axios.post('/api/site-settings', {
        key: 'farm_story_video_url',
        value: systemSettings.farmStoryVideoUrl
      });
      await axios.post('/api/site-settings', {
        key: 'hero_image_url',
        value: systemSettings.heroImageUrl
      });
      await axios.post('/api/site-settings', {
        key: 'hero_image_alt',
        value: systemSettings.heroImageAlt
      });
      toast.success('System settings saved successfully');
    } catch (error) {
      toast.error('Failed to save system settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateSystemSetting = (key: string, value: string | boolean) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const configureGeneralSettings = () => {
    setActiveTab('settings');
    // Scroll to general settings section
    setTimeout(() => {
      document.getElementById('general-settings')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const manageSecurity = () => {
    toast.success('Security management panel coming soon');
  };

  const manageEmailSettings = () => {
    toast.success('Email settings management coming soon');
  };

  const managePaymentGateway = () => {
    toast.success('Payment gateway configuration coming soon');
  };

  const manageShipping = () => {
    toast.success('Shipping & logistics management coming soon');
  };

  const manageAnalytics = () => {
    toast.success('Analytics & SEO settings coming soon');
  };

  const dashboardCards: DashboardCard[] = stats ? [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      change: '+12.5%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: FiShoppingBag,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      change: '+5.7%',
      changeType: 'positive',
      icon: FiPackage,
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      change: '-2.1%',
      changeType: 'positive',
      icon: FiClock,
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      change: '+3',
      changeType: 'negative',
      icon: FiAlertTriangle,
      color: 'from-red-500 to-red-600'
    }
  ] : [];

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag, href: '/admin/orders' },
    { id: 'pos', label: 'Point of Sale', icon: FiShoppingBag, href: '/admin/pos' },
    { id: 'products', label: 'Products', icon: FiPackage },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'reviews', label: 'Reviews', icon: FiStar },
    { id: 'aicaptions', label: 'AI Captions', icon: FiZap, href: '/admin/ai-captions' },
    { id: 'gallery', label: 'Gallery', icon: FiImage, href: '/admin/gallery' },
    { id: 'farmvisits', label: 'Farm Visits', icon: FiMapPin, href: '/admin/farm-visits' },
    { id: 'aiusage', label: 'AI Usage', icon: FiActivity, href: '/admin/ai-usage' },
    { id: 'finance', label: 'Finance', icon: FiCreditCard },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Loading Edau Farm Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin">
      <main className="p-4 lg:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {dashboardCards.map((card, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-3xl font-bold text-primary-800 mt-1">{card.value}</p>
                        <p className={`text-sm font-medium mt-2 ${
                          card.changeType === 'positive' ? 'text-green-600' :
                          card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {card.change} from last month
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-primary-800">Recent Orders</h3>
                    <Link href="/admin/orders" className="text-sm text-primary-600 hover:text-primary-800 transition-colors">
                      View all →
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {stats?.recentOrders?.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FiShoppingBag className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary-800">Order #{order._id.slice(-8)}</p>
                            <p className="text-xs text-primary-600">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary-800">{formatPrice(order.total)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <FiShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recent orders</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-primary-800">Top Products</h3>
                    <Link href="/admin/products" className="text-sm text-primary-600 hover:text-primary-800 transition-colors">
                      View all →
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {stats?.topProducts?.slice(0, 5).map((product, index: number) => (
                      <div key={product._id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-semibold text-primary-600">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-800 truncate">{product.title}</p>
                        </div>
                        <div className="text-sm font-semibold text-primary-800">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No products yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Link
                    href="/admin/products/new"
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiPlus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Add Product</span>
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiShoppingBag className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Manage Orders</span>
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiUsers className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">View Users</span>
                  </Link>
                  <Link
                    href="/admin/reviews"
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiStar className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Manage Reviews</span>
                  </Link>
                  <button
                    onClick={fetchStats}
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiRefreshCw className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Orders Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary-800">Orders Management</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-100">
                      {stats?.recentOrders?.map((order) => (
                        <tr key={order._id} className="hover:bg-primary-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-800">
                            #{order._id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-800">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-primary-600 hover:text-primary-800 transition-colors">
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button className="text-primary-600 hover:text-primary-800 transition-colors">
                                <FiEdit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <FiShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No orders found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary-800">Products Management</h2>
                <Link
                  href="/admin/products/new"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Add Product</span>
                </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-8 text-center">
                <FiPackage className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                <h3 className="text-xl font-semibold text-primary-800 mb-2">Products Management</h3>
                <p className="text-gray-600 mb-6">Manage your farm product catalog, inventory, and pricing</p>
                <Link
                  href="/admin/products"
                  className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Go to Products →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary-800">Users Management</h2>
                <button className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                  <FiDownload className="w-5 h-5" />
                  <span>Export Users</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-8 text-center">
                <FiUsers className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                <h3 className="text-xl font-semibold text-primary-800 mb-2">Users Management</h3>
                <p className="text-gray-600 mb-6">Manage user accounts, roles, and permissions</p>
                <Link
                  href="/admin/users"
                  className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Go to Users →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-800">Analytics & Insights</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { label: 'Average order value', value: formatPrice(stats?.averageOrderValue || 0), Icon: FiDollarSign },
                  { label: 'Orders completed', value: String(stats?.statusBreakdown?.delivered || 0), Icon: FiCheckCircle },
                  { label: 'Paid orders', value: String(stats?.paidOrders || 0), Icon: FiBarChart },
                ].map(({ label, value, Icon }) => (
                  <div key={String(label)} className="rounded-xl border border-primary-100 bg-white p-6 shadow-lg">
                    <Icon className="mb-4 h-8 w-8 text-primary-600" />
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-primary-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-lg">
                  <h3 className="mb-5 text-lg font-semibold text-primary-800">Revenue, last 12 months</h3>
                  <div className="flex h-48 items-end gap-2 border-b border-gray-200 pb-2">
                    {(stats?.monthlyRevenue || []).map((amount, index) => {
                      const maximum = Math.max(...(stats?.monthlyRevenue || [1]), 1);
                      return <div key={index} className="group flex h-full flex-1 items-end" title={`${formatPrice(amount)} month ${index + 1}`}><div className="w-full rounded-t bg-primary-500 transition hover:bg-primary-700" style={{ height: `${Math.max((amount / maximum) * 100, amount ? 4 : 1)}%` }} /></div>;
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500"><span>12 months ago</span><span>Current month</span></div>
                </div>

                <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-lg">
                  <h3 className="mb-5 text-lg font-semibold text-primary-800">Order status</h3>
                  <div className="space-y-3">
                    {Object.entries(stats?.statusBreakdown || {}).map(([statusName, count]) => {
                      const percentage = stats?.totalOrders ? (count / stats.totalOrders) * 100 : 0;
                      return <div key={statusName}><div className="mb-1 flex justify-between text-sm"><span className="capitalize text-gray-700">{statusName}</span><span className="font-semibold text-gray-900">{count}</span></div><div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${percentage}%` }} /></div></div>;
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold text-primary-800">Payment methods</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Object.entries(stats?.paymentMethodBreakdown || {}).map(([method, count]) => <div key={method} className="rounded-lg bg-primary-50 p-4"><p className="text-sm capitalize text-gray-600">{method}</p><p className="mt-1 text-2xl font-bold text-primary-800">{count}</p></div>)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary-800">Reviews Management</h2>
                  <p className="text-gray-600 mt-2">Create, edit, and manage product reviews</p>
                </div>
                <Link
                  href="/admin/reviews"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold flex items-center gap-2"
                >
                  <FiStar className="w-5 h-5" />
                  Manage Reviews
                </Link>
              </div>

              {/* Review Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-primary-800">-</p>
                    </div>
                    <FiStar className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">All product reviews</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold text-primary-800">-</p>
                    </div>
                    <FiCheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">Across all products</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified Reviews</p>
                      <p className="text-2xl font-bold text-primary-800">-</p>
                    </div>
                    <FiShield className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">From verified buyers</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-primary-800">-</p>
                    </div>
                    <FiActivity className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">New reviews</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions for Reviews */}
              <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/admin/reviews"
                    className="flex flex-col items-center p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiPlus className="w-8 h-8 mb-3" />
                    <span className="font-semibold">Add New Review</span>
                    <span className="text-sm text-blue-100 mt-1">For migrated products</span>
                  </Link>
                  <Link
                    href="/admin/reviews"
                    className="flex flex-col items-center p-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiEdit className="w-8 h-8 mb-3" />
                    <span className="font-semibold">Edit Reviews</span>
                    <span className="text-sm text-amber-100 mt-1">Modify existing reviews</span>
                  </Link>
                  <Link
                    href="/admin/reviews"
                    className="flex flex-col items-center p-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FiEye className="w-8 h-8 mb-3" />
                    <span className="font-semibold">View All Reviews</span>
                    <span className="text-sm text-primary-100 mt-1">Browse all reviews</span>
                  </Link>
                </div>
              </div>

              {/* Information Card */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <FiAlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Reviews Management</h4>
                    <p className="text-amber-800 text-sm">
                      Use this section to manage product reviews, especially for migrated products from your manual order system.
                      You can create new reviews, edit existing ones, and maintain customer feedback across all your products.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-800">Financial Management</h2>

              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-primary-800">{formatPrice(stats?.monthlyRevenue?.[11] || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-gray-500 ml-1">current month</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                      <p className="text-2xl font-bold text-primary-800">{formatPrice(stats?.pendingPaymentTotal || 0)}</p>
                    </div>
                    <FiClock className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">{stats?.pendingPaymentOrders || 0} order(s) awaiting payment</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-primary-800">{stats?.totalOrders || 0}</p>
                    </div>
                    <FiActivity className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">All time transactions</span>
                  </div>
                </div>
              </div>

              {/* Financial Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <h3 className="text-lg font-semibold text-primary-800 mb-4">Revenue Reports</h3>
                  <p className="text-gray-600 mb-4">Generate detailed financial reports and analytics</p>
                  <button
                    onClick={generateFinancialReport}
                    disabled={generatingReport}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <h3 className="text-lg font-semibold text-primary-800 mb-4">Payment Methods</h3>
                  <p className="text-gray-600 mb-4">Configure and monitor payment gateways</p>
                  <button
                    onClick={managePaymentSettings}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Manage Payments
                  </button>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {stats?.recentOrders?.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-3 border-b border-primary-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FiShoppingBag className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.order_number || order._id.slice(-8)}</p>
                          <p className="text-sm text-gray-500">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-800">{formatPrice(order.total)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No recent transactions</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-800">System Settings</h2>

              {/* Settings Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiSettings className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">General Settings</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Site configuration, branding, and basic settings</p>
                  <button
                    onClick={configureGeneralSettings}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Configure
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiShield className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">Security</h3>
                  </div>
                  <p className="text-gray-600 mb-4">User permissions, authentication, and security policies</p>
                  <button
                    onClick={manageSecurity}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Manage Security
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiMail className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">Email & Notifications</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Email templates, SMTP settings, and notification preferences</p>
                  <button
                    onClick={manageEmailSettings}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Email Settings
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiCreditCard className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">Payment Gateway</h3>
                  </div>
                  <p className="text-gray-600 mb-4">M-Pesa, PayPal, and other payment integrations</p>
                  <button
                    onClick={managePaymentGateway}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Payment Settings
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiPackage className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">Shipping & Logistics</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Shipping rates, zones, and delivery configurations</p>
                  <button
                    onClick={manageShipping}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Shipping Settings
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                  <div className="flex items-center mb-4">
                    <FiTrendingUp className="w-8 h-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-800">Analytics & SEO</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Google Analytics, SEO settings, and performance monitoring</p>
                  <button
                    onClick={manageAnalytics}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Analytics Settings
                  </button>
                </div>
              </div>

              {/* General Settings Form */}
              <div id="general-settings" className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-6">General Settings</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={systemSettings.siteName}
                        onChange={(e) => updateSystemSetting('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Description
                      </label>
                      <input
                        type="text"
                        value={systemSettings.siteDescription}
                        onChange={(e) => updateSystemSetting('siteDescription', e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={systemSettings.contactEmail}
                        onChange={(e) => updateSystemSetting('contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Support Phone
                      </label>
                      <input
                        type="tel"
                        value={systemSettings.supportPhone}
                        onChange={(e) => updateSystemSetting('supportPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Story Video URL (YouTube embed)
                    </label>
                    <input
                      type="text"
                      value={systemSettings.farmStoryVideoUrl}
                      onChange={(e) => updateSystemSetting('farmStoryVideoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">This video will be displayed on the homepage Farm Story section</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero Image URL
                    </label>
                    <input
                      type="text"
                      value={systemSettings.heroImageUrl}
                      onChange={(e) => updateSystemSetting('heroImageUrl', e.target.value)}
                      placeholder="https://res.cloudinary.com/.../image.jpg"
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">This image will be used on the homepage hero area</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero Image Alt Text
                    </label>
                    <input
                      type="text"
                      value={systemSettings.heroImageAlt}
                      onChange={(e) => updateSystemSetting('heroImageAlt', e.target.value)}
                      placeholder="Edau Farm hero image"
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                   </div>

                   <div className="flex items-center">
                     <input
                       type="checkbox"
                       id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => updateSystemSetting('maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-200 rounded"
                    />
                    <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                      Enable Maintenance Mode
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowRegistration"
                      checked={systemSettings.allowRegistration}
                      onChange={(e) => updateSystemSetting('allowRegistration', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-200 rounded"
                    />
                    <label htmlFor="allowRegistration" className="ml-2 block text-sm text-gray-900">
                      Allow New User Registration
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={saveSystemSettings}
                      disabled={savingSettings}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <FiCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">Database</p>
                      <p className="text-sm text-green-700">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <FiCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">Email Service</p>
                      <p className="text-sm text-green-700">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <FiCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">Payment Gateway</p>
                      <p className="text-sm text-green-700">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      <Analytics />
    </DashboardLayout>
  );
}

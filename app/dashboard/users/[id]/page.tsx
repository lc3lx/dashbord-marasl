"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, MapPin, Package, CreditCard, Activity, ArrowLeft, TrendingUp, Edit, Ban, Wallet, Eye, Clock, CheckCircle } from 'lucide-react';
import { useGetUserWalletQuery, useGetUserActivityQuery } from '../../../api/adminApi';
import { motion } from 'framer-motion';
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserDetails() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Real data
  const { data: walletResp, isLoading: walletLoading } = useGetUserWalletQuery({ userId });
  const { data: activityResp, isLoading: activityLoading } = useGetUserActivityQuery({ userId });
  const profile = walletResp?.data?.user;
  const wallet = walletResp?.data?.wallet;
  const transactions = walletResp?.data?.transactions || [];
  const orders = activityResp?.data?.activity?.orders || [];
  const shipments = activityResp?.data?.activity?.shipments || [];
  const totalSpent = shipments.reduce((sum: number, s: any) => sum + (s?.ordervalue ?? s?.totalprice ?? 0), 0);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">غير مصرح لك بالوصول</h1>
          <Link href="/dashboard" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-block">
            العودة للداشبورد
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'shipment': return <Package className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'login': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
        <motion.div 
          className="space-y-8 p-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 rounded-2xl shadow-2xl"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href="/dashboard/users" 
                  className="text-white/80 hover:text-white mb-2 inline-flex items-center gap-2 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  العودة لقائمة المستخدمين
                </Link>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">تفاصيل المستخدم</h1>
                  <p className="text-indigo-100 text-lg">معلومات شاملة عن المستخدم ونشاطه</p>
                </div>
                
                <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20"
                  >
                    <Edit className="w-5 h-5" />
                    تعديل المستخدم
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Info Card */}
            <motion.div 
              className="lg:col-span-1"
              variants={itemVariants}
            >
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                      <span className="text-3xl font-bold text-white">
                        {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {profile?.firstName} {profile?.lastName || 'مستخدم'}
                    </h2>
                    <div className="flex justify-center mb-4">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        profile?.active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profile?.active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center p-4 bg-white/50 rounded-xl">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center ml-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">البريد الإلكتروني</dt>
                        <dd className="text-lg font-semibold text-gray-900">{profile?.email || '—'}</dd>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 bg-white/50 rounded-xl">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center ml-4">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">رقم الهاتف</dt>
                        <dd className="text-lg font-semibold text-gray-900">{profile?.phone || '—'}</dd>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 bg-white/50 rounded-xl">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center ml-4">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">تاريخ الانضمام</dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA') : '—'}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex space-x-3 space-x-reverse">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5" />
                      تعديل
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
                    >
                      <Ban className="w-5 h-5" />
                      إيقاف
                    </motion.button>
                  </div>
                </div>
              </motion.div>

            {/* Stats and Activity */}
            <motion.div 
              className="lg:col-span-2 space-y-8"
              variants={itemVariants}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الشحنات</p>
                      <p className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">{shipments.length.toLocaleString('en-US')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600 font-medium">شحنة مكتملة</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المصروفات</p>
                      <p className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">{totalSpent.toLocaleString('en-US')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-full">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">ريال سعودي</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الطلبات</p>
                      <p className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">{orders.length.toLocaleString('en-US')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full">
                        <Activity className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-purple-600 font-medium">طلب مسجل</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">رصيد المحفظة</p>
                      <p className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">{(wallet?.balance ?? 0).toLocaleString('en-US')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
                        <Wallet className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600 font-medium">ريال سعودي</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <motion.div 
                className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden shadow-lg"
                whileHover={{ y: -4 }}
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">النشاط الأخير</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        آخر الشحنات
                      </h4>
                      <div className="space-y-3">
                        {shipments.slice(0,5).map((s: any) => (
                          <motion.div 
                            key={s._id} 
                            className="flex items-center justify-between py-3 px-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {s.trackingId || s.companyshipmentid || `شحنة #${s._id.slice(-6)}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(s.createdAt).toLocaleDateString('ar-SA')}
                                </div>
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        ))}
                        {!shipments.length && (
                          <div className="text-center py-8">
                            <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500">لا توجد شحنات</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white/50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        آخر الطلبات
                      </h4>
                      <div className="space-y-3">
                        {orders.slice(0,5).map((o: any) => (
                          <motion.div 
                            key={o._id} 
                            className="flex items-center justify-between py-3 px-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Activity className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {o.orderNumber || `طلب #${o._id.slice(-6)}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(o.createdAt).toLocaleDateString('ar-SA')}
                                </div>
                              </div>
                            </div>
                            <Clock className="w-5 h-5 text-amber-500" />
                          </motion.div>
                        ))}
                        {!orders.length && (
                          <div className="text-center py-8">
                            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500">لا توجد طلبات</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* User's Shipments */}
              <motion.div 
                className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden shadow-lg"
                whileHover={{ y: -4 }}
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">شحنات المستخدم</h3>
                    </div>
                    <Link 
                      href={`/dashboard/shipments?userId=${userId}`} 
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 hover:gap-3 transition-all"
                    >
                      عرض الكل
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {shipments.length ? (
                    <div className="space-y-3">
                      {shipments.slice(0,5).map((s: any) => (
                        <motion.div 
                          key={s._id} 
                          className="flex items-center justify-between py-4 px-6 bg-white/70 rounded-xl hover:bg-white transition-colors"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {s.trackingId || s.companyshipmentid || `شحنة #${s._id.slice(-6)}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {s.shapmentCompany || 'شركة الشحن'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {(s.ordervalue ?? s.totalprice ?? 0).toLocaleString()} ريال
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(s.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد شحنات</h3>
                      <p className="text-gray-500">لم يقم المستخدم بإنشاء أي شحنات بعد</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

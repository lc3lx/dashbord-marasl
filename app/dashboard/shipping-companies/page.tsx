"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/app/providers/AuthProvider";
import { shippingCompaniesAPI } from "@/lib/api";
import { Plus, Save, Trash2, X, Edit3, Truck, TrendingUp, Package, Settings, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Minimal local wrappers to mimic RTK Query hooks using the existing API client
type ShipmentCompany = any;

function useGetAllShipmentCompaniesQuery() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await shippingCompaniesAPI.getAll();
      let companiesData: any[] = [];
      if (response?.result && Array.isArray(response.result)) {
        companiesData = response.result;
      } else if (response?.success && response?.data) {
        companiesData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response?.data)) {
        companiesData = response.data;
      } else if (Array.isArray(response)) {
        companiesData = response as any[];
      } else if (response && typeof response === "object" && (response as any).name) {
        companiesData = [response];
      }
      setData(companiesData);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, isLoading, refetch } as const;
}

function useCreateShipmentCompanyMutation() {
  const [isLoading, setLoading] = useState(false);
  const mutate = async (payload: any) => {
    try {
      setLoading(true);
      const res = await shippingCompaniesAPI.create(payload);
      return { unwrap: async () => res };
    } finally {
      setLoading(false);
    }
  };
  return [mutate, { isLoading }] as const;
}

function useUpdateShipmentCompanyMutation() {
  const [isLoading, setLoading] = useState(false);
  const mutate = async ({ id, data }: { id: string; data: any }) => {
    try {
      setLoading(true);
      const res = await shippingCompaniesAPI.update(id, data);
      return { unwrap: async () => res };
    } finally {
      setLoading(false);
    }
  };
  return [mutate, { isLoading }] as const;
}

function useDeleteShipmentCompanyMutation() {
  const [isLoading, setLoading] = useState(false);
  const mutate = async (id: string) => {
    try {
      setLoading(true);
      const res = await shippingCompaniesAPI.delete(id);
      return { unwrap: async () => res };
    } finally {
      setLoading(false);
    }
  };
  return [mutate, { isLoading }] as const;
}

type AllowedBoxSize = { length: number; width: number; height: number; _id?: string };

type ShippingTypeRow = {
  type: "Dry" | "Cold" | "Quick" | "Box" | "offices";
  code: string;
  RTOcode: string;
  COD: boolean;
  maxCodAmount: number;
  maxWeight: number;
  denayWeight?: number;
  maxBoxes: number;
  priceaddedtax: number;
  basePrice: number;
  profitPrice: number;
  baseRTOprice: number;
  profitRTOprice: number;
  baseAdditionalweigth: number;
  profitAdditionalweigth: number;
  baseCODfees: number;
  profitCODfees: number;
  insurancecost: number;
  basepickUpPrice: number;
  profitpickUpPrice: number;
  _id?: string;
  fuelSurcharge: number;
};

type FormState = {
  _id?: string;
  company: "smsa" | "redbox" | "omniclama" | "aramex" | "";
  deliveryTime: string;
  caver?: string;
  deliveryAt?: string;
  shipmentDelivertype?: string;
  minShipments: number;
  minWeight: number;
  maxWeight: number;
  maxBoxes: number;
  status: "Enabled" | "Disabled" | "";
  conditions: string;
  details: string;
  conditionsAr: string;
  detailsAr: string;
  trackingURL: string;
  pickUpStatus: "Yes" | "No" | "";
  shippingTypes: ShippingTypeRow[];
  allowedBoxSizes: AllowedBoxSize[];
  maxBoxDimensions?: { length: number; width: number; height: number };
  basePrice?: number;
  email?: string;
  phone?: string;
  isActive?: boolean;
};

const emptyType: ShippingTypeRow = {
  type: "Dry",
  code: "",
  RTOcode: "",
  COD: false,
  maxCodAmount: 0,
  maxWeight: 0,
  denayWeight: 0,
  maxBoxes: 1,
  priceaddedtax: 0.15,
  basePrice: 0,
  profitPrice: 0,
  baseRTOprice: 0,
  profitRTOprice: 0,
  baseAdditionalweigth: 0,
  profitAdditionalweigth: 0,
  baseCODfees: 0,
  profitCODfees: 0,
  insurancecost: 0,
  basepickUpPrice: 0,
  profitpickUpPrice: 0,
  fuelSurcharge: 0,
};

const emptyBox: AllowedBoxSize = { length: 0, width: 0, height: 0 };

const emptyForm: FormState = {
  company: "",
  deliveryTime: "2-3 أيام عمل",
  minShipments: 1,
  minWeight: 0,
  maxWeight: 0,
  maxBoxes: 0,
  status: "Enabled",
  conditions: "",
  details: "",
  conditionsAr: "",
  detailsAr: "",
  trackingURL: "",
  pickUpStatus: "Yes",
  shippingTypes: [emptyType],
  allowedBoxSizes: [],
  maxBoxDimensions: { length: 0, width: 0, height: 0 },
  basePrice: 0,
  email: "",
  phone: "",
  isActive: true,
};

export default function ShippingCompaniesPage() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useGetAllShipmentCompaniesQuery();
  const [createCompany, { isLoading: creating }] = useCreateShipmentCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateShipmentCompanyMutation();
  const [deleteCompany, { isLoading: deleting }] = useDeleteShipmentCompanyMutation();

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const saving = creating || updating;

  useEffect(() => {
    if (!openForm) setForm(emptyForm);
  }, [openForm]);

  const list = useMemo(() => Array.isArray(data) ? data : [], [data]);

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

  if (!user || user.role !== "admin") {
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

  // Calculate stats
  const totalCompanies = list.length;
  const enabledCompanies = list.filter(c => c.status === 'Enabled').length;
  const totalShippingTypes = list.reduce((sum, c) => sum + ((c as any).shipmentType || (c as any).shippingTypes || []).length, 0);
  const companiesWithBoxes = list.filter(c => (c.allowedBoxSizes || []).length > 0).length;

  const startCreate = () => {
    setIsEdit(false);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const startEdit = (c: ShipmentCompany) => {
    setIsEdit(true);
    setForm({
      _id: c._id,
      company: (c.company as any) || "",
      deliveryTime: c.deliveryTime || "2-3 أيام عمل",
      caver: (c as any).caver || "",
      deliveryAt: (c as any).deliveryAt || "",
      shipmentDelivertype: (c as any).shipmentDelivertype || "",
      minShipments: c.minShipments ?? 1,
      minWeight: (c as any).minWeight ?? 0,
      maxWeight: (c as any).maxWeight ?? 0,
      maxBoxes: (c as any).maxBoxes ?? 0,
      status: (c.status as any) || "Enabled",
      conditions: c.conditions || "",
      details: c.details || "",
      conditionsAr: c.conditionsAr || "",
      detailsAr: c.detailsAr || "",
      trackingURL: c.trackingURL || "",
      pickUpStatus: c.pickUpStatus || "Yes",
      shippingTypes:
        ((c as any).shipmentType?.length ? (c as any).shipmentType : (c as any).shippingTypes) || [],
      allowedBoxSizes: c.allowedBoxSizes || [],
      maxBoxDimensions: (c as any).maxBoxDimensions || { length: 0, width: 0, height: 0 },
      basePrice: (c as any).basePrice ?? 0,
      email: (c as any).email || "",
      phone: (c as any).phone || "",
      isActive: (c as any).isActive ?? true,
    });
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!form.company || !form.status || !form.pickUpStatus) return;
    if ((form.company === "omniclama" || form.company === "redbox") && form.allowedBoxSizes.length === 0) return;
    const payload: any = {
      company: form.company,
      deliveryTime: form.deliveryTime,
      caver: form.caver,
      deliveryAt: form.deliveryAt,
      shipmentDelivertype: form.shipmentDelivertype,
      minShipments: form.minShipments,
      minWeight: form.minWeight,
      maxWeight: form.maxWeight,
      maxBoxes: form.maxBoxes,
      status: form.status,
      conditions: form.conditions,
      details: form.details,
      conditionsAr: form.conditionsAr,
      detailsAr: form.detailsAr,
      trackingURL: form.trackingURL,
      pickUpStatus: form.pickUpStatus,
      shippingTypes: form.shippingTypes,
      allowedBoxSizes: form.allowedBoxSizes,
      maxBoxDimensions: form.maxBoxDimensions,
      basePrice: form.basePrice,
      email: form.email,
      phone: form.phone,
      isActive: form.isActive,
    };
    if (isEdit && form._id) {
      await updateCompany({ id: form._id, data: payload }).catch(() => {});
    } else {
      await createCompany(payload).catch(() => {});
    }
    setOpenForm(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteCompany(id).catch(() => {});
    refetch();
  };

  const updateType = (idx: number, key: keyof ShippingTypeRow, value: any) => {
    setForm((prev) => {
      const arr = [...prev.shippingTypes];
      const row = { ...arr[idx], [key]: value } as ShippingTypeRow;
      arr[idx] = row;
      return { ...prev, shippingTypes: arr };
    });
  };

  const updateBox = (idx: number, key: keyof AllowedBoxSize, value: any) => {
    setForm((prev) => {
      const arr = [...prev.allowedBoxSizes];
      const row = { ...arr[idx], [key]: value } as AllowedBoxSize;
      arr[idx] = row;
      return { ...prev, allowedBoxSizes: arr };
    });
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
            className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href="/dashboard" 
                  className="text-white/80 hover:text-white mb-2 inline-flex items-center gap-2 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  العودة للداشبورد
                </Link>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">إدارة شركات الشحن</h1>
                  <p className="text-blue-100 text-lg">إدارة وتكوين شركات الشحن وأنواع الخدمات المتاحة</p>
                </div>
                
                <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCreate}
                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة شركة
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={itemVariants}
          >
            <motion.div 
              className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white transition-all duration-500 group overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                boxShadow: '0 20px 40px -12px rgba(59, 130, 246, 0.15), 0 8px 16px -8px rgba(59, 130, 246, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">إجمالي الشركات</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3">{totalCompanies.toLocaleString()}</p>
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 text-blue-500 ml-1" />
                    <span className="text-sm text-blue-600 font-medium">شركة شحن</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Truck className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white transition-all duration-500 group overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                boxShadow: '0 20px 40px -12px rgba(34, 197, 94, 0.15), 0 8px 16px -8px rgba(34, 197, 94, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">الشركات المفعلة</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3">{enabledCompanies.toLocaleString()}</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                    <span className="text-sm text-green-600 font-medium">نشطة</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white transition-all duration-500 group overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                boxShadow: '0 20px 40px -12px rgba(147, 51, 234, 0.15), 0 8px 16px -8px rgba(147, 51, 234, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">أنواع الشحن</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3">{totalShippingTypes.toLocaleString()}</p>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-purple-500 ml-1" />
                    <span className="text-sm text-purple-600 font-medium">نوع متاح</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Package className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white transition-all duration-500 group overflow-hidden"
              whileHover={{ y: -8, scale: 1.02 }}
              style={{
                boxShadow: '0 20px 40px -12px rgba(245, 158, 11, 0.15), 0 8px 16px -8px rgba(245, 158, 11, 0.1)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">شركات بصناديق</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3">{companiesWithBoxes.toLocaleString()}</p>
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 text-amber-500 ml-1" />
                    <span className="text-sm text-amber-600 font-medium">مكونة</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <Settings className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Companies Table */}
          <motion.div 
            className="relative bg-white/90 backdrop-blur-sm rounded-3xl border border-white/20 p-8 overflow-hidden"
            variants={itemVariants}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full translate-y-16 -translate-x-16"></div>
            
            <div className="relative space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">قائمة شركات الشحن</h3>
                
                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startCreate}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 transition-all font-medium shadow-lg md:hidden"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة شركة
                  </motion.button>
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-7 gap-4 text-sm font-semibold text-gray-700">
                    <div>الشركة</div>
                    <div>الحالة</div>
                    <div>الالتقاط</div>
                    <div>الحد الأدنى</div>
                    <div>أنواع الشحن</div>
                    <div>الصناديق</div>
                    <div>الإجراءات</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="p-6 text-center text-gray-500">جاري التحميل...</div>
                  ) : list.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">لا توجد شركات</div>
                  ) : (
                    list.map((c) => (
                      <motion.div
                        key={c._id}
                        className="grid grid-cols-7 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                        whileHover={{ backgroundColor: "#f9fafb" }}
                      >
                        <div className="font-semibold text-gray-900">{c.company}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            c.status === 'Enabled' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            c.pickUpStatus === 'Yes' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {c.pickUpStatus}
                          </span>
                        </div>
                        <div className="text-gray-700">{c.minShipments}</div>
                        <div className="text-gray-700">{((c as any).shipmentType || (c as any).shippingTypes || []).length}</div>
                        <div className="text-gray-700">{(c.allowedBoxSizes || []).length}</div>
                        <div className="flex items-center gap-2 justify-end">
                          <motion.button 
                            onClick={() => startEdit(c)} 
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sky-600 border-sky-200 hover:bg-sky-50 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Edit3 className="w-4 h-4" /> تعديل
                          </motion.button>
                          <motion.button 
                            onClick={() => handleDelete(c._id)} 
                            disabled={deleting} 
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-red-600 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" /> حذف
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Form Modal */}
      {openForm && (
        <motion.div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white/95 backdrop-blur-sm w-full max-w-7xl mx-4 rounded-3xl border border-white/20 shadow-2xl max-h-[98vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-6">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{isEdit ? "تعديل شركة الشحن" : "إضافة شركة شحن جديدة"}</h2>
                    <p className="text-blue-100 text-sm">إدارة بيانات وإعدادات شركة الشحن</p>
                  </div>
                </div>
                <motion.button 
                  onClick={() => setOpenForm(false)} 
                  className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="max-h-[calc(98vh-200px)] overflow-y-auto">
              {/* Basic Info Section */}
              <div className="p-6 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    المعلومات الأساسية
                  </h3>
                  <p className="text-sm text-gray-600">بيانات الشركة والإعدادات العامة</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">الشركة</label>
                    <select 
                      value={form.company} 
                      onChange={(e) => setForm({ ...form, company: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="">اختر الشركة</option>
                      <option value="smsa">SMSA</option>
                      <option value="redbox">RedBox</option>
                      <option value="omniclama">Omniclama</option>
                      <option value="aramex">Aramex</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">مدة التوصيل</label>
                    <input 
                      value={form.deliveryTime} 
                      onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} 
                      placeholder="مثال: 2-3 أيام عمل"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">الحالة</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="Enabled">مفعل</option>
                      <option value="Disabled">معطل</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">خدمة الالتقاط</label>
                    <select 
                      value={form.pickUpStatus} 
                      onChange={(e) => setForm({ ...form, pickUpStatus: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="Yes">متاح</option>
                      <option value="No">غير متاح</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">الحد الأدنى للشحنات</label>
                    <input 
                      type="number" 
                      value={form.minShipments} 
                      onChange={(e) => setForm({ ...form, minShipments: Number(e.target.value) })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">رابط التتبع</label>
                    <input 
                      value={form.trackingURL} 
                      onChange={(e) => setForm({ ...form, trackingURL: e.target.value })} 
                      placeholder="https://tracking.company.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">الشروط (إنجليزي)</label>
                    <textarea 
                      value={form.conditions} 
                      onChange={(e) => setForm({ ...form, conditions: e.target.value })} 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="أدخل الشروط والأحكام باللغة الإنجليزية..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">التفاصيل (إنجليزي)</label>
                    <textarea 
                      value={form.details} 
                      onChange={(e) => setForm({ ...form, details: e.target.value })} 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="أدخل التفاصيل باللغة الإنجليزية..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">الشروط (عربي)</label>
                    <textarea 
                      value={form.conditionsAr} 
                      onChange={(e) => setForm({ ...form, conditionsAr: e.target.value })} 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="أدخل الشروط والأحكام باللغة العربية..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">التفاصيل (عربي)</label>
                    <textarea 
                      value={form.detailsAr} 
                      onChange={(e) => setForm({ ...form, detailsAr: e.target.value })} 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="أدخل التفاصيل باللغة العربية..."
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Types Section */}
              <div className="p-6 bg-white border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    أنواع الشحن والتسعير
                  </h3>
                  <p className="text-sm text-gray-600">إعدادات أنواع الشحن المختلفة والأسعار</p>
                </div>
                
                <div className="space-y-4">
                  {form.shippingTypes.map((t, idx) => (
                    <motion.div 
                      key={idx} 
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-purple-900">نوع الشحن #{idx + 1}</h4>
                        <motion.button 
                          onClick={() => setForm((prev) => ({ ...prev, shippingTypes: prev.shippingTypes.filter((_, i) => i !== idx) }))} 
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">النوع</label>
                          <select 
                            value={t.type} 
                            onChange={(e) => updateType(idx, "type", e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                          >
                            <option value="Dry">جاف</option>
                            <option value="Cold">مبرد</option>
                            <option value="Quick">سريع</option>
                            <option value="Box">صندوق</option>
                            <option value="offices">مكاتب</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">كود الشحن</label>
                          <input 
                            value={t.code} 
                            onChange={(e) => updateType(idx, "code", e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="كود"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">كود الإرجاع</label>
                          <input 
                            value={t.RTOcode} 
                            onChange={(e) => updateType(idx, "RTOcode", e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="RTO"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الحد الأقصى COD</label>
                          <input 
                            type="number" 
                            value={t.maxCodAmount} 
                            onChange={(e) => updateType(idx, "maxCodAmount", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الحد الأقصى للوزن</label>
                          <input 
                            type="number" 
                            value={t.maxWeight} 
                            onChange={(e) => updateType(idx, "maxWeight", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الحد الأقصى للصناديق</label>
                          <input 
                            type="number" 
                            value={t.maxBoxes} 
                            onChange={(e) => updateType(idx, "maxBoxes", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">السعر الأساسي</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={t.basePrice} 
                            onChange={(e) => updateType(idx, "basePrice", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الربح</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={t.profitPrice} 
                            onChange={(e) => updateType(idx, "profitPrice", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">رسوم COD (أساس)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={t.baseCODfees} 
                            onChange={(e) => updateType(idx, "baseCODfees", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">رسوم COD (ربح)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={t.profitCODfees} 
                            onChange={(e) => updateType(idx, "profitCODfees", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">التأمين</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={t.insurancecost} 
                            onChange={(e) => updateType(idx, "insurancecost", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse pt-4 lg:pt-6 sm:col-span-2 md:col-span-3 lg:col-span-1">
                          <input 
                            type="checkbox" 
                            id={`cod-${idx}`}
                            checked={t.COD} 
                            onChange={(e) => updateType(idx, "COD", e.target.checked)} 
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`cod-${idx}`} className="text-sm font-medium text-gray-700">دفع عند الاستلام</label>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <motion.button 
                    onClick={() => setForm((prev) => ({ ...prev, shippingTypes: [...prev.shippingTypes, { ...emptyType }] }))} 
                    className="w-full p-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-5 h-5" />
                    إضافة نوع شحن جديد
                  </motion.button>
                </div>
              </div>

              {/* Box Sizes Section */}
              <div className="p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    أحجام الصناديق المسموحة
                  </h3>
                  <p className="text-sm text-gray-600">تحديد أبعاد الصناديق المسموحة للشحن</p>
                </div>
                
                <div className="space-y-4">
                  {form.allowedBoxSizes.map((b, idx) => (
                    <motion.div 
                      key={idx} 
                      className="bg-white border border-amber-200 rounded-xl p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-amber-900">صندوق #{idx + 1}</h4>
                        <motion.button 
                          onClick={() => setForm((prev) => ({ ...prev, allowedBoxSizes: prev.allowedBoxSizes.filter((_, i) => i !== idx) }))} 
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الطول (سم)</label>
                          <input 
                            type="number" 
                            value={b.length} 
                            onChange={(e) => updateBox(idx, "length", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">العرض (سم)</label>
                          <input 
                            type="number" 
                            value={b.width} 
                            onChange={(e) => updateBox(idx, "width", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">الارتفاع (سم)</label>
                          <input 
                            type="number" 
                            value={b.height} 
                            onChange={(e) => updateBox(idx, "height", Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <motion.button 
                    onClick={() => setForm((prev) => ({ ...prev, allowedBoxSizes: [...prev.allowedBoxSizes, { ...emptyBox }] }))} 
                    className="w-full p-4 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-5 h-5" />
                    إضافة حجم صندوق جديد
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-slate-100 border-t-2 border-gray-300 p-4 sm:p-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
              
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="hidden sm:block text-sm text-gray-600 font-medium">
                  {isEdit ? '✏️ تعديل بيانات الشركة' : '➕ إضافة شركة جديدة'}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <motion.button 
                    onClick={() => setOpenForm(false)} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200 shadow-sm order-2 sm:order-1"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    إلغاء
                  </motion.button>
                  
                  <motion.button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`
                      relative w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-xl shadow-2xl transition-all duration-300 flex items-center gap-3 min-w-[200px] sm:min-w-[240px] justify-center order-1 sm:order-2
                      ${saving 
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-500 hover:via-green-600 hover:to-teal-600 active:scale-95 ring-4 ring-emerald-200 hover:ring-emerald-300'
                      }
                      text-white border-4 border-white/30 backdrop-blur-sm
                    `}
                    whileHover={!saving ? { 
                      scale: 1.08, 
                      y: -4,
                      boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.6), 0 0 0 1px rgba(255,255,255,0.5)"
                    } : {}}
                    whileTap={!saving ? { scale: 0.92 } : {}}
                    style={{
                      boxShadow: saving 
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' 
                        : '0 25px 50px -12px rgba(16, 185, 129, 0.4), 0 8px 16px -8px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
                    
                    {saving ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="animate-pulse">جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Save className="w-6 h-6 drop-shadow-lg" />
                          <div className="absolute inset-0 w-6 h-6 bg-white/20 rounded animate-ping"></div>
                        </div>
                        <span className="drop-shadow-lg tracking-wide">
                          {isEdit ? '💾 حفظ التعديلات' : '✨ إضافة الشركة'}
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}

import React, { useState } from 'react';
import {
    MapPin, Calendar, FastForward, Columns, UserPlus, Printer,
    Calculator, RotateCcw, MoreVertical, Plus, User, Search,
    Scan, Utensils, Package, Bike, ShoppingBag, Pause, Lock,
    FileText, Clock, Trash2, Edit2, ArrowRight, ChevronRight,
    UserCheck
} from 'lucide-react';

export default function POSDashboard() {
    const [selectedOrderType, setSelectedOrderType] = useState('1 Dining');
    const [selectedCategory, setSelectedCategory] = useState('Categories');

    const orderTypes = [
        { id: '1 Dining', label: '1 Dining', icon: Utensils, activeBg: 'bg-indigo-50 border-indigo-600 text-indigo-700' },
        { id: '2 Parcel', label: '2 Parcel', icon: Package },
        { id: '3 Zomato', label: '3 Zomato', icon: ShoppingBag, color: 'text-red-500' },
        { id: '4 Swiggy', label: '4 Swiggy', icon: ShoppingBag, color: 'text-orange-500' },
        { id: '5 Delivery', label: '5 Delivery', icon: Bike, color: 'text-emerald-600' },
    ];

    const categories = ['Categories', 'Starters', 'Main Course', 'Tandoori', 'Biryani', 'Rice', 'Beverages', 'Desserts'];

    const foodItems = [
        { id: 1, name: 'Veg Manchurian', price: 120.00, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop' },
        { id: 2, name: 'Paneer 65', price: 150.00, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&auto=format&fit=crop' },
        // { id: 3, name: 'Chicken 65', price: 170.00, img: 'https://images.unsplash.com/photo-1610057099443-f23023023927?w=300&auto=format&fit=crop' },
        { id: 4, name: 'Chicken Biryani', price: 180.00, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop' },
        { id: 5, name: 'Veg Biryani', price: 140.00, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop' },
        { id: 6, name: 'Gobi 65', price: 110.00, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&auto=format&fit=crop' },
        { id: 7, name: 'Fried Rice', price: 120.00, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&auto=format&fit=crop' },
        { id: 8, name: 'Noodles', price: 110.00, img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&auto=format&fit=crop' },
        { id: 9, name: 'Butter Naan', price: 40.00, img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&auto=format&fit=crop' },
        { id: 10, name: 'Garlic Naan', price: 50.00, img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&auto=format&fit=crop' },
        { id: 11, name: 'Butter Chicken', price: 180.00, img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&auto=format&fit=crop' },
        { id: 12, name: 'Dal Fry', price: 110.00, img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop' },
    ];

    const runningTables = [
        { id: 1, name: 'Table 1', capacity: '4 Seater', amount: '₹ 1,250.00', time: '00:25:15', bg: 'bg-emerald-50/40 border-emerald-200', tagBg: 'bg-emerald-100 text-emerald-800' },
        { id: 2, name: 'Table 2', capacity: '2 Seater', amount: '₹ 680.00', time: '00:15:40', bg: 'bg-amber-50/40 border-amber-200', tagBg: 'bg-amber-100 text-amber-800' },
        { id: 3, name: 'Table 3', capacity: '6 Seater', amount: '₹ 2,340.00', time: '00:45:10', bg: 'bg-sky-50/40 border-sky-200', tagBg: 'bg-sky-100 text-sky-800' },
        { id: 4, name: 'Table 4', capacity: '4 Seater', amount: '₹ 920.00', time: '00:30:20', badge: 'KOT Sent', badgeStyle: 'bg-indigo-100 text-indigo-600', bg: 'bg-purple-50/40 border-purple-200' },
        { id: 5, name: 'Table 5', capacity: '2 Seater', amount: '₹ 410.00', time: '00:10:05', badge: 'Bill Requested', badgeStyle: 'bg-red-100 text-red-500', bg: 'bg-rose-50/40 border-rose-200' },
        { id: 6, name: 'Table 6', capacity: '4 Seater', amount: '₹ 1,150.00', time: '00:35:50', bg: 'bg-emerald-50/40 border-emerald-200', tagBg: 'bg-emerald-100 text-emerald-800' },
    ];

    const currentOrderItems = [
        { name: 'Chicken Biryani', qty: 1, price: 180.00, total: 180.00 },
        { name: 'Paneer 65', qty: 1, price: 150.00, total: 150.00 },
        { name: 'Fried Rice', qty: 2, price: 120.00, total: 240.00 },
        { name: 'Coke (250ml)', qty: 2, price: 30.00, total: 60.00 },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#f1f3f7] text-slate-700 text-[11px] font-sans select-none p-2 gap-2 overflow-hidden">

            {/* Top Navbar */}
            <header className="bg-white rounded-lg px-3 py-1.5 flex items-center justify-between border border-slate-200 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <span className="text-slate-400">Location</span>
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 ml-1" />
                        <span className="font-semibold text-slate-800">JKANS FOODS</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-semibold">14-08-2026 12:10 PM</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><FastForward className="w-4 h-4" /></button>
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Columns className="w-4 h-4" /></button>
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><UserPlus className="w-4 h-4" /></button>
                    <button className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Printer className="w-4 h-4" /></button>
                    <button className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Calculator className="w-4 h-4" /></button>
                    <button className="p-1.5 text-rose-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><RotateCcw className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><MoreVertical className="w-4 h-4" /></button>
                    <button className="ml-2 bg-white border border-indigo-600 text-indigo-600 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 hover:bg-indigo-50">
                        <Plus className="w-3.5 h-3.5" /> Add Expense
                    </button>
                </div>
            </header>

            {/* Main Grid Section */}
            <div className="flex flex-1 gap-2 overflow-hidden">

                {/* Main Catalog View (Left) */}
                <div className="flex-[2.6] flex flex-col gap-2 overflow-hidden">

                    {/* Top Inputs: Customer Selection & Search */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 flex-1">
                            <div className="flex items-center gap-2 px-2 text-slate-600 border-r border-slate-200 flex-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-800">Walk-In Customer</span>
                            </div>
                            <button className="p-1 bg-indigo-600 text-white rounded-md ml-1"><Plus className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 px-3 gap-2">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-800 text-xs">2</span>
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 flex-[1.8] justify-between">
                            <input
                                type="text"
                                placeholder="Scan barcode or search product"
                                className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <Scan className="w-4 h-4 text-indigo-600 cursor-pointer" />
                                <button className="p-1 bg-indigo-600 text-white rounded-md"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Order Categories Buttons */}
                    <div className="flex gap-2">
                        {orderTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedOrderType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedOrderType(type.id)}
                                    className={`flex-1 py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${isSelected
                                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${type.color || (isSelected ? 'text-indigo-600' : 'text-slate-500')}`} />
                                    <span>{type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub Categories horizontal scroll */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-md font-semibold text-[10px] transition-all whitespace-nowrap ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 cursor-pointer" />
                    </div>

                    {/* Food Items Catalog */}
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 p-2.5 overflow-y-auto grid grid-cols-4 gap-2.5">
                        {foodItems.map((item) => (
                            <div
                                key={item.id}
                                className="border border-slate-200/60 rounded-xl p-2 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <img
                                    src={item.img}
                                    alt={item.name}
                                    className="w-full h-20 object-cover rounded-lg mb-2"
                                />
                                <div>
                                    <div className="font-bold text-slate-800 text-[11px] truncate">{item.name}</div>
                                    <div className="text-slate-600 font-semibold text-[10px] mt-0.5">₹ {item.price.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Indicators */}
                    <div className="flex justify-center items-center gap-1.5 py-0.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    </div>
                </div>

                {/* Middle Section: Running Tables */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px]">RUNNING TABLES</span>
                        <button className="text-indigo-600 hover:underline font-semibold text-[10px]">View All</button>
                    </div>

                    {/* Table Cards List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 my-1">
                        {runningTables.map((table) => (
                            <div
                                key={table.id}
                                className={`p-2.5 rounded-lg border flex flex-col gap-1.5 relative ${table.bg}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-white border border-slate-200/50">
                                            <Utensils className="w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-[11px]">{table.name}</div>
                                            <div className="text-[9px] text-slate-400">{table.capacity}</div>
                                        </div>
                                    </div>
                                    {table.badge && (
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${table.badgeStyle}`}>
                                            {table.badge}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-slate-100/50">
                                    <span className="font-bold text-emerald-600">{table.amount}</span>
                                    <div className="flex items-center gap-1 text-slate-500 text-[9px]">
                                        <Clock className="w-3 h-3" />
                                        <span>{table.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add Table / Booking
                    </button>
                </div>

                {/* Right Section: Current Order / Checkout Summary */}
                <div className="flex-[1.2] bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-bold text-slate-800 text-xs">Current Order</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded uppercase">DINE-IN - 1</span>
                                <button className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        {/* Itemized Order Table Header */}
                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 py-1.5 border-b border-slate-100">
                            <div className="col-span-5">Item</div>
                            <div className="col-span-3 text-center">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        {/* Order Items Rows */}
                        <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
                            {currentOrderItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 text-[10px] items-center text-slate-700">
                                    <div className="col-span-5 font-bold text-slate-800 truncate">{item.name}</div>
                                    <div className="col-span-3 flex items-center justify-center gap-1 bg-slate-50 rounded border border-slate-200 py-0.5">
                                        <button className="text-slate-400 hover:text-slate-600 px-1 font-bold">-</button>
                                        <span className="font-bold text-slate-800">{item.qty}</span>
                                        <button className="text-slate-400 hover:text-slate-600 px-1 font-bold">+</button>
                                    </div>
                                    <div className="col-span-2 text-right text-slate-500 font-medium">₹{item.price.toFixed(0)}</div>
                                    <div className="col-span-2 text-right font-bold text-slate-800 flex items-center justify-end gap-1">
                                        <span>₹{item.total.toFixed(0)}</span>
                                        <button className="text-rose-400 hover:text-rose-600 text-[10px]">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Breakdown Summary */}
                    <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Items Total ({currentOrderItems.length})</span>
                            <span className="font-semibold text-slate-700">₹630.00</span>
                        </div>
                        <div className="flex justify-between text-slate-500 items-center">
                            <span className="flex items-center gap-1">Discount <Edit2 className="w-2.5 h-2.5 text-indigo-600 cursor-pointer" /></span>
                            <span className="font-semibold text-slate-700">₹30.00</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (GST 5%)</span>
                            <span className="font-semibold text-slate-700">₹30.00</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Round Off</span>
                            <span className="font-semibold text-slate-700">₹0.00</span>
                        </div>

                        <div className="bg-indigo-50/60 p-2 rounded-lg flex justify-between items-center border border-indigo-100/50 my-1.5">
                            <span className="font-bold text-indigo-900 text-xs">Total Payable</span>
                            <span className="font-extrabold text-indigo-700 text-sm">₹630.00</span>
                        </div>

                        <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors text-xs">
                            <span>Proceed to Pay</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Bottom Footer Actions & Quick Payment Panel */}
            <footer className="flex items-center justify-between gap-2 pt-0.5">

                {/* Quick Action Trigger Buttons */}
                <div className="flex items-center gap-1.5">
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-rose-500 w-14 h-11">
                        <Pause className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Suspend</span>
                    </button>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-sky-500 w-14 h-11">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Hold</span>
                    </button>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-emerald-600 w-14 h-11">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">KOT</span>
                    </button>
                </div>

                {/* Primary Payment Gateways Selection */}
                <div className="flex items-center gap-1.5 flex-1 justify-center max-w-xl">
                    <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center shadow-sm text-[11px]">
                        Credit Sale
                    </button>
                    <button className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-center shadow-sm text-[11px]">
                        Card
                    </button>
                    <button className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-center shadow-sm text-[11px]">
                        Multiple Pay
                    </button>
                    <button className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-center shadow-sm text-[11px]">
                        Cash
                    </button>
                    <button className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-center shadow-sm text-[11px]">
                        UPI / GPAY
                    </button>
                </div>

                {/* Total & Recent Transactions Section */}
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-0.5 flex flex-col items-end">
                        <span className="text-[8px] text-emerald-700 font-bold uppercase tracking-tight">Total Payable</span>
                        <span className="text-xs font-black text-emerald-600">₹630.00</span>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Recent Transactions</span>
                    </button>
                </div>

            </footer>

        </div>
    );
}
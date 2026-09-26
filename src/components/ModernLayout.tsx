import React from 'react';
import { 
  LayoutDashboard, CheckSquare, Inbox, Mail, LayoutTemplate, 
  Settings, Search, Share, ChevronDown, Plus, Filter, Download
} from 'lucide-react';

export default function ModernDashboardLayout() {
  return (
    // Nền tổng của ứng dụng (Màu Dark Navy trầm)
    <div className="flex h-screen bg-[#0B0E14] text-slate-300 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR BÊN TRÁI */}
      <aside className="w-64 flex flex-col bg-[#131620] border-r border-slate-800/60 p-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            R
          </div>
          <span className="text-white font-semibold tracking-wide">Revamp Cloud</span>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search here..." 
            className="w-full bg-[#1C202E] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-800 placeholder-slate-500 transition-all"
          />
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
          {/* Nhóm General */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-wider px-2">General</h3>
            <ul className="space-y-1">
              <li className="flex items-center gap-3 px-3 py-2 bg-blue-600/10 text-blue-400 rounded-lg cursor-pointer">
                <LayoutDashboard size={18}/> <span className="text-sm font-medium">Dashboard</span>
              </li>
              <li className="flex items-center gap-3 px-3 py-2 hover:bg-[#1C202E] text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors">
                <CheckSquare size={18}/> <span className="text-sm">My tasks</span>
              </li>
              <li className="flex items-center justify-between px-3 py-2 hover:bg-[#1C202E] text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center gap-3"><Inbox size={18}/> <span className="text-sm">Inbox</span></div>
                <span className="bg-[#1C202E] text-xs py-0.5 px-2 rounded-full">3</span>
              </li>
            </ul>
          </div>
        </nav>

        {/* Cấu hình User dưới cùng */}
        <div className="mt-auto pt-4 border-t border-slate-800/60">
           <li className="flex items-center gap-3 px-3 py-2 hover:bg-[#1C202E] text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors">
              <Settings size={18}/> <span className="text-sm">Settings</span>
           </li>
        </div>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 bg-[#0B0E14]">
          <div className="text-sm">
            <span className="text-slate-500 hover:text-slate-300 cursor-pointer">Dashboard</span> 
            <span className="mx-2 text-slate-700">{'>'}</span> 
            <span className="text-slate-200 font-medium">Deals Overview</span>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1C202E] text-slate-300 rounded-lg text-sm border border-slate-700/50 hover:bg-slate-800 transition-colors">
               Try AI summary
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors">
               <Share size={16} /> Share
            </button>
          </div>
        </header>

        {/* Nội dung Dashboard (Có scroll) */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Tiêu đề vùng */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-white tracking-tight">Deals statistics</h1>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#131620] text-slate-300 rounded-lg text-sm border border-slate-800 hover:bg-[#1C202E] transition-colors">View reports</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#131620] text-slate-300 rounded-lg text-sm border border-slate-800 hover:bg-[#1C202E] transition-colors">
                Select timeframe <ChevronDown size={14}/>
              </button>
            </div>
          </div>

          {/* Dãy Thẻ Thống Kê (Stat Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Thẻ 1 */}
            <div className="bg-[#131620] p-5 rounded-2xl border border-slate-800/60 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <span className="p-1.5 bg-[#1C202E] rounded-md"><CheckSquare size={14} className="text-blue-400"/></span> Deals win rate
                 </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1 flex items-baseline gap-2">
                 78% <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+11.8%</span>
              </div>
              <div className="text-xs text-slate-500">From last month</div>
            </div>
            {/* Lặp lại cấu trúc thẻ cho các phần tử khác... */}
          </div>

          {/* Dãy Biểu Đồ (Charts Area) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="bg-[#131620] p-5 rounded-2xl border border-slate-800/60 h-72 col-span-1 flex flex-col">
               <h3 className="text-sm font-medium text-slate-300 mb-6">Pipeline</h3>
               {/* Thay thế phần này bằng biểu đồ thực tế (Recharts / Chart.js) */}
               <div className="flex-1 border-b border-l border-slate-800 flex items-end justify-around pb-0">
                  <div className="w-3 bg-cyan-400 rounded-t-sm h-[60%]"></div>
                  <div className="w-3 bg-emerald-400 rounded-t-sm h-[80%]"></div>
                  <div className="w-3 bg-purple-500 rounded-t-sm h-[40%]"></div>
                  <div className="w-3 bg-pink-500 rounded-t-sm h-[50%]"></div>
               </div>
               <div className="flex justify-around text-[10px] text-slate-500 mt-2 font-medium">
                  <span>1</span><span>2</span><span>3</span><span>4</span>
               </div>
            </div>
            
            {/* Khu vực bạn có thể nhúng giao diện Video Timeline của hệ thống cũ vào đây */}
            <div className="bg-[#131620] p-5 rounded-2xl border border-slate-800/60 h-72 col-span-2 flex items-center justify-center">
               <span className="text-slate-600 border border-dashed border-slate-700 p-4 rounded-lg">Khu vực nhúng Component (Timeline / Video Player)</span>
            </div>
          </div>

          {/* Bảng Danh Sách (Data Table) */}
          <div className="bg-[#131620] rounded-2xl border border-slate-800/60 overflow-hidden">
            <div className="p-5 border-b border-slate-800/60 flex flex-wrap gap-4 justify-between items-center bg-[#131620]">
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C202E] text-slate-300 rounded-lg text-sm border border-slate-800">All pipeline <ChevronDown size={14}/></button>
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C202E] text-slate-300 rounded-lg text-sm border border-slate-800"><Filter size={14}/> Show filter</button>
              </div>
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C202E] text-slate-300 rounded-lg text-sm border border-slate-800"><Download size={14}/> Import CSV</button>
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={14}/> Create deal</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#131620]">
                  <tr className="text-xs text-slate-500 border-b border-slate-800/60">
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Deal Name</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className="hover:bg-[#1C202E]/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-cyan-400"></div> UI/UX Design
                    </td>
                    <td className="px-6 py-4 text-slate-400">Room Inc</td>
                    <td className="px-6 py-4 font-medium text-white">$550</td>
                    <td className="px-6 py-4"><span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">Contract sent</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

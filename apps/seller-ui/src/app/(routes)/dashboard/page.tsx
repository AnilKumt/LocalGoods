"use client";
import React from "react";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
} from "recharts";

const revenueDaily = [
	{ label: "Mon", revenue: 4200 },
	{ label: "Tue", revenue: 5100 },
	{ label: "Wed", revenue: 4700 },
	{ label: "Thu", revenue: 5600 },
	{ label: "Fri", revenue: 6000 },
	{ label: "Sat", revenue: 6800 },
	{ label: "Sun", revenue: 7200 },
];

const revenueWeekly = [
	{ label: "W1", revenue: 28500 },
	{ label: "W2", revenue: 31200 },
	{ label: "W3", revenue: 29800 },
	{ label: "W4", revenue: 34100 },
];

const revenueMonthly = [
	{ label: "Jun", revenue: 118000 },
	{ label: "Jul", revenue: 126500 },
	{ label: "Aug", revenue: 120300 },
	{ label: "Sep", revenue: 134200 },
	{ label: "Oct", revenue: 142800 },
	{ label: "Nov", revenue: 150900 },
];

const productPerformance = [
	{ name: "Eco Tote Bag", views: 8200, conversions: 640, revenue: 256000 },
	{ name: "Bamboo Toothbrush", views: 15400, conversions: 950, revenue: 190000 },
	{ name: "Recycled Notebook", views: 9800, conversions: 720, revenue: 144000 },
	{ name: "Steel Water Bottle", views: 20100, conversions: 1300, revenue: 390000 },
];

const demographics = [
	{ name: "18-24", value: 22 },
	{ name: "25-34", value: 41 },
	{ name: "35-44", value: 21 },
	{ name: "45+", value: 16 },
];

const behavior = [
	{ label: "New", value: 58 },
	{ label: "Returning", value: 42 },
];

const inventoryAlerts = {
	lowStock: [
		{ sku: "WB-500", name: "Steel Water Bottle", stock: 12 },
		{ sku: "TB-100", name: "Bamboo Toothbrush", stock: 8 },
	],
	bestSellers: [
		{ sku: "NB-300", name: "Recycled Notebook", sold: 1300 },
		{ sku: "EB-200", name: "Eco Tote Bag", sold: 1580 },
	],
};

const PIE_COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f472b6", "#34d399"];

function StatCard({ title, value, delta, hint }: { title: string; value: string; delta?: string; hint?: string }) {
	return (
		<div className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
			<div className="text-slate-300 text-sm">{title}</div>
			<div className="mt-1 flex items-baseline gap-2">
				<div className="text-white text-2xl font-semibold">{value}</div>
				{delta ? <span className="text-green-400 text-xs">{delta}</span> : null}
			</div>
			{hint ? <div className="text-slate-500 text-xs mt-1">{hint}</div> : null}
		</div>
	);
}

export default function DashboardPage() {
	const [range, setRange] = React.useState<"Daily" | "Weekly" | "Monthly">("Daily");
	const revenueData = range === "Daily" ? revenueDaily : range === "Weekly" ? revenueWeekly : revenueMonthly;

	return (
		<div className="p-8">
			{/* Top: Revenue + Quick Stats */}
			<div className="w-full flex gap-8">
				<div className="w-[65%] rounded-2xl">
					<h2 className="text-white text-xl font-semibold">
						Revenue Reports
						<span className="block text-sm text-slate-400 font-normal">Daily, weekly and monthly sales with trends</span>
					</h2>

					<div className="mt-4 flex items-center gap-2">
						{(["Daily", "Weekly", "Monthly"] as const).map((r) => (
							<button
								key={r}
								className={`px-3 py-1.5 rounded-md text-sm border ${range === r ? "bg-slate-800 text-white border-slate-600" : "text-slate-300 border-slate-700 hover:bg-slate-800/60"}`}
								onClick={() => setRange(r)}
							>
								{r}
							</button>
						))}
					</div>

					<div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
						<div className="h-[320px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={revenueData}>
									<XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: "#334155" }} />
									<YAxis stroke="#94a3b8" tickLine={false} axisLine={{ stroke: "#334155" }} />
									<Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
									<Legend wrapperStyle={{ color: "#fff" }} />
									<Line type="monotone" dataKey="revenue" name="Revenue" stroke="#60a5fa" strokeWidth={2} dot={false} />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>

				<div className="w-[35%] flex flex-col gap-4">
					<StatCard title="Total Revenue" value="₹15.09L" delta="↑ 5.6% vs prev." hint="Last selected period" />
					<StatCard title="Avg. Order Value" value="₹1,160" hint="Across all orders" />
					<StatCard title="Conversion Rate" value="3.8%" delta="↑ 0.4%" />
				</div>
			</div>

			{/* Middle: Product Performance + Customer Insights */}
			<div className="w-full mt-8 flex gap-8">
				<div className="w-[60%]">
					<h2 className="text-white text-xl font-semibold">
						Product Performance
						<span className="block text-sm text-slate-400 font-normal">Views, conversions, and revenue</span>
					</h2>
					<div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
						<table className="min-w-full text-sm text-white">
							<thead className="bg-slate-800 text-slate-300">
								<tr>
									<th className="p-3 text-left">Product</th>
									<th className="p-3 text-left">Views</th>
									<th className="p-3 text-left">Conversions</th>
									<th className="p-3 text-left">Conv. Rate</th>
									<th className="p-3 text-left">Revenue</th>
								</tr>
							</thead>
							<tbody className="bg-transparent">
								{productPerformance.map((p) => {
									const rate = p.views ? ((p.conversions / p.views) * 100).toFixed(1) + "%" : "-";
									return (
										<tr key={p.name} className="border-t border-slate-700 hover:bg-slate-800">
											<td className="p-3">{p.name}</td>
											<td className="p-3 text-slate-300">{p.views.toLocaleString()}</td>
											<td className="p-3 text-slate-300">{p.conversions.toLocaleString()}</td>
											<td className="p-3"><span className="text-green-400">{rate}</span></td>
											<td className="p-3">₹{(p.revenue / 100).toLocaleString()}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				<div className="w-[40%]">
					<h2 className="text-white text-xl font-semibold">
						Customer Insights
						<span className="block text-sm text-slate-400 font-normal">Demographics and behavior</span>
					</h2>
					<div className="mt-4 grid grid-cols-1 gap-4">
						<div className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
							<div className="text-slate-300 text-sm mb-2">Age Demographics</div>
							<div className="h-[240px]">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie data={demographics} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#0f172a" strokeWidth={2}>
											{demographics.map((_, i) => (
												<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
							<div className="text-slate-300 text-sm mb-2">Visitor Behavior</div>
							<div className="h-[220px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={behavior}>
										<XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: "#334155" }} />
										<YAxis stroke="#94a3b8" tickLine={false} axisLine={{ stroke: "#334155" }} />
										<Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
										<Bar dataKey="value" name="% of visitors" fill="#4ade80" radius={[6, 6, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom: Inventory Alerts */}
			<div className="w-full mt-8 flex gap-8">
				<div className="w-[60%]">
					<h2 className="text-white text-xl font-semibold">
						Inventory Alerts
						<span className="block text-sm text-slate-400 font-normal">Low stock items and bestselling products</span>
					</h2>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
							<div className="text-slate-300 text-sm mb-3">Low Stock</div>
							<ul className="space-y-2">
								{inventoryAlerts.lowStock.map((item) => (
									<li key={item.sku} className="flex items-center justify-between">
										<div>
											<div className="text-white">{item.name}</div>
											<div className="text-slate-500 text-xs">SKU: {item.sku}</div>
										</div>
										<span className="text-amber-400 text-sm">{item.stock} left</span>
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
							<div className="text-slate-300 text-sm mb-3">Bestselling Products</div>
							<ul className="space-y-2">
								{inventoryAlerts.bestSellers.map((item) => (
									<li key={item.sku} className="flex items-center justify-between">
										<div>
											<div className="text-white">{item.name}</div>
											<div className="text-slate-500 text-xs">SKU: {item.sku}</div>
										</div>
										<span className="text-green-400 text-sm">{item.sold.toLocaleString()} sold</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="w-[40%]">
					<h2 className="text-white text-xl font-semibold">
						Sales Breakdown
						<span className="block text-sm text-slate-400 font-normal">By customer device type</span>
					</h2>
					<div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
						<div className="h-[260px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={[{ name: "Phone", value: 55 }, { name: "Tablet", value: 18 }, { name: "Desktop", value: 27 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#0f172a" strokeWidth={2}>
										{[0, 1, 2].map((i) => (
											<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
										))}
									</Pie>
									<Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
									<Legend wrapperStyle={{ color: "#fff" }} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
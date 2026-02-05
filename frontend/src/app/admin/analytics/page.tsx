"use client";

import { useEffect, useState } from "react";
import { 
    Users, 
    BookOpen, 
    Layers, 
    FileText, 
    CheckCircle2, 
    Zap, 
    TrendingUp,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/lib/api/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AnalyticsData {
    total_users: number;
    total_courses: number;
    total_units: number;
    total_lessons: number;
    total_challenges: number;
    average_xp: number;
    active_users: number;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const result = await adminApi.getAnalytics();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full w-full flex items-center justify-center text-slate-500">
                No data available.
            </div>
        );
    }

    const stats = [
        {
            title: "Total Users",
            value: data.total_users,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-100",
        },
        {
            title: "Active Users",
            value: data.active_users,
            icon: TrendingUp,
            color: "text-green-500",
            bg: "bg-green-100",
        },
        {
            title: "Average XP",
            value: `${data.average_xp} XP`,
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-100",
        },
        {
            title: "Total Courses",
            value: data.total_courses,
            icon: BookOpen,
            color: "text-purple-500",
            bg: "bg-purple-100",
        },
        {
            title: "Total Units",
            value: data.total_units,
            icon: Layers,
            color: "text-indigo-500",
            bg: "bg-indigo-100",
        },
        {
            title: "Total Lessons",
            value: data.total_lessons,
            icon: FileText,
            color: "text-orange-500",
            bg: "bg-orange-100",
        },
        {
            title: "Total Challenges",
            value: data.total_challenges,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-100",
        },
    ];

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">
                    Platform Analytics
                </h1>
                <p className="text-slate-500 mt-1">
                    Track user engagement and content growth.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bg} p-2 rounded-xl`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-slate-900">
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="my-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <h3 className="text-xl font-bold mb-4">Quick Insights</h3>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>{data.active_users} users have earned XP on the platform.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>On average, users have earned {data.average_xp} XP.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            <span>There are {data.total_lessons} lessons across {data.total_courses} courses.</span>
                        </li>
                    </ul>
                </Card>

                <div className="flex items-center justify-center p-8 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium text-center">
                        More detailed charts and daily trends <br /> coming in the next update.
                    </p>
                </div>
            </div>
        </div>
    );
}

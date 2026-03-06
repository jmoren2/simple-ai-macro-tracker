'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type MacroData = {
    protein: number;
    carbs: number;
    fat: number;
};

const COLORS = ['#4ade80', '#60a5fa', '#facc15']; // green, blue, yellow

export default function MacroPieChart({ data }: { data: MacroData }) {
    const pieData = [
        { name: 'Protein', value: data.protein },
        { name: 'Carbs', value: data.carbs },
        { name: 'Fat', value: data.fat },
    ];

    return (
        <div className="w-full h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name }) => name}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

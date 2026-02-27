import type { Task, TaskCompletion, User } from '../types';

export interface UserStats {
    user: User;
    points: number;
}

export function calculateRankings(
    users: User[],
    tasks: Task[],
    completions: TaskCompletion[],
    filterMoth?: number, // 0-11
    filterYear?: number
): UserStats[] {
    const stats: Record<string, number> = {};
    users.forEach((u) => {
        stats[u.id] = 0;
    });

    completions.forEach((completion) => {
        const task = tasks.find((t) => t.id === completion.taskId);
        if (!task) return;

        if (filterMoth !== undefined && filterYear !== undefined) {
            const date = new Date(completion.timestamp);
            if (date.getMonth() !== filterMoth || date.getFullYear() !== filterYear) {
                return;
            }
        }

        if (stats[completion.userId] !== undefined) {
            stats[completion.userId] += task.points;
        }
    });

    const rankings = users.map((user) => ({
        user,
        points: stats[user.id] || 0,
    }));

    // Sort by points descending
    rankings.sort((a, b) => b.points - a.points);

    return rankings;
}

import type { Task, TaskCompletion, User } from '../types';

export interface UserStats {
    user: User;
    points: number;
}

export function calculateRankings(
    users: User[],
    _tasks: Task[], // No need to find if total points is stored in completion
    completions: TaskCompletion[],
    filterMonth?: number, // 0-11
    filterYear?: number
): UserStats[] {
    const stats: Record<string, number> = {};
    users.forEach((u) => {
        stats[u.id] = 0;
    });

    completions.forEach((completion) => {
        if (filterMonth !== undefined && filterYear !== undefined) {
            const date = new Date(completion.completed_at);
            if (date.getMonth() !== filterMonth || date.getFullYear() !== filterYear) {
                return;
            }
        }

        if (stats[completion.user_id] !== undefined) {
            stats[completion.user_id] += (completion.points_earned || 0);
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

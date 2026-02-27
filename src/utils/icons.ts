import {
    Home, Tent, Castle, Building, Hotel, Warehouse,
    Cat, Dog, Bird, Rabbit, Heart, Star, Sun, Moon,
    Zap, Gem, Trophy, Hexagon, Circle, Square,
    Ghost, Smile, PawPrint, Snail, Fish, Anchor,
    Crown, Music, Flower, Flame, Rocket
} from 'lucide-react';

export const ICONS = {
    Home, Tent, Castle, Building, Hotel, Warehouse,
    Cat, Dog, Bird, Rabbit, Heart, Star, Sun, Moon,
    Zap, Gem, Trophy, Hexagon, Circle, Square,
    Ghost, Smile, PawPrint, Snail, Fish, Anchor,
    Crown, Music, Flower, Flame, Rocket
} as const;

export type IconName = keyof typeof ICONS;

export const getIcon = (name: string) => {
    return ICONS[name as keyof typeof ICONS] || Home;
};


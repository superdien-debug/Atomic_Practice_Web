import 'lucide-react-native';

declare module 'lucide-react-native' {
    export interface LucideProps {
        color?: string;
        fill?: string;
        style?: any;
        strokeWidth?: number | string;
        opacity?: number | string;
    }
}

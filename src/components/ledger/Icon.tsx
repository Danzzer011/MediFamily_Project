import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// One line-icon set (24 px grid, 2 px stroke). The first four also name the appointment statuses.
const SHAPES = {
  scheduled: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </>
  ),
  completed: <Path d="M20 6L9 17l-5-5" />,
  cancelled: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M4.9 4.9l14.2 14.2" />
    </>
  ),
  missed: <Path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01" />,
  bell: <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  'calendar-plus': (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
    </>
  ),
  camera: (
    <>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <Circle cx="12" cy="13" r="4" />
    </>
  ),
  upload: <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  image: (
    <>
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Path d="M21 15l-5-5L5 21" />
    </>
  ),
  pdf: (
    <>
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Path d="M14 2v6h6M16 13H8M16 17H8" />
    </>
  ),
  next: <Path d="M9 18l6-6-6-6" />,
  back: <Path d="M15 18l-6-6 6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof SHAPES;

// Decorative: the label next to it says what it means, so screen readers skip it.
export default function Icon({ name, size = 16, color }: { name: IconName; size?: number; color: string }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {SHAPES[name]}
      </Svg>
    </View>
  );
}

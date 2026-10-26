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
  // the profile menu and the password field
  heart: <Path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />,
  activity: <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  pill: (
    <>
      <Rect x="2" y="8" width="20" height="8" rx="4" transform="rotate(-45 12 12)" />
      <Path d="M8.5 8.5l7 7" />
    </>
  ),
  box: (
    <>
      <Path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
      <Path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  clipboard: (
    <>
      <Rect x="5" y="4" width="14" height="18" rx="2" />
      <Path d="M9 2h6v4H9zM9 12h6M9 16h4" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  folder: <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  users: (
    <>
      <Circle cx="9" cy="7" r="4" />
      <Path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2M16 3.1a4 4 0 010 7.8M23 21v-2a4 4 0 00-3-3.9" />
    </>
  ),
  eye: (
    <>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <Path d="M17.9 17.9A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.1-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2M14.1 14.1a3 3 0 01-4.2-4.2M1 1l22 22" />
  ),
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

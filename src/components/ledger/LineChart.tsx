import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { useThemeColors } from '../../theme';

export type ChartSeries = { name: string; values: number[] };

type LineChartProps = {
  labels: string[]; // one per reading, oldest first, e.g. "21 Oct"
  series: ChartSeries[]; // one line each, e.g. top and bottom number for blood pressure
};

const HEIGHT = 200;
// the bottom gap leaves room for the lowest numbers and, under them, the dates
const PAD = { top: 22, right: 16, bottom: 46, left: 16 };
const DATE_ROW = HEIGHT - 6;
const BASELINE = HEIGHT - 22;

// A simple line chart: each reading is a dot with its number above it, joined by a line.
// It only draws the saved numbers. The colours tell the lines apart; they never judge a value.
export default function LineChart({ labels, series }: LineChartProps) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);
  const lineColors = [colors.primary, colors.text];

  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1; // all the same: avoid dividing by zero

  // where a reading goes on the drawing
  const x = (index: number) =>
    labels.length === 1 ? width / 2 : PAD.left + (index * (width - PAD.left - PAD.right)) / (labels.length - 1);
  const y = (value: number) => PAD.top + ((max - value) * (HEIGHT - PAD.top - PAD.bottom)) / range;

  return (
    <View>
      {series.length > 1 ? (
        <View style={styles.legend}>
          {series.map((s, i) => (
            <View key={s.name} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: lineColors[i] }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>{s.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {/* the baseline under the dots */}
            <Line x1={PAD.left} x2={width - PAD.right} y1={BASELINE} y2={BASELINE} stroke={colors.border} strokeWidth={1} />

            {series.map((s, i) => (
              <Polyline
                key={s.name}
                points={s.values.map((v, index) => `${x(index)},${y(v)}`).join(' ')}
                fill="none"
                stroke={lineColors[i]}
                strokeWidth={2}
              />
            ))}

            {series.map((s, i) =>
              s.values.map((v, index) => (
                <Circle key={`${s.name}-${index}`} cx={x(index)} cy={y(v)} r={4} fill={colors.surface} stroke={lineColors[i]} strokeWidth={2} />
              )),
            )}

            {series.map((s, i) =>
              s.values.map((v, index) => (
                <SvgText
                  key={`${s.name}-label-${index}`}
                  x={x(index)}
                  // the top line's numbers sit above its dots, the bottom line's numbers below
                  y={i === 0 ? y(v) - 9 : y(v) + 17}
                  fontSize={11}
                  fontWeight="700"
                  fill={lineColors[i]}
                  textAnchor="middle">
                  {String(v)}
                </SvgText>
              )),
            )}

            {labels.map((label, index) => (
              <SvgText key={label + index} x={x(index)} y={DATE_ROW} fontSize={11} fill={colors.textMuted} textAnchor="middle">
                {label}
              </SvgText>
            ))}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  legendText: { fontSize: 12, fontWeight: '600' },
});

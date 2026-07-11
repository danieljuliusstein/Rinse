import { StyleSheet, View, type ViewStyle } from 'react-native'

/** Two equal columns for form fields (name/phone, revenue/tip). */
export function FormRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
})

import { Children, isValidElement, type ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

/** Two equal columns for form fields (name/phone, revenue/tip). */
export function FormRow({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      {Children.map(children, (child, index) => {
        if (child == null || child === false) return null
        return (
          <View key={isValidElement(child) && child.key != null ? String(child.key) : index} style={styles.col}>
            {child}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
})

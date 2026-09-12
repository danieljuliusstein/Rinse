import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    objectFit: 'contain',
    padding: 4,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d4d4ce',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    fontSize: 10,
    color: '#9a9a94',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})

export function PdfBusinessLogo({
  logoDataUri,
  size = 64,
}: {
  logoDataUri?: string | null
  size?: number
}) {
  if (logoDataUri) {
    return <Image src={logoDataUri} style={[styles.logo, { width: size, height: size }]} />
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size }]}>
      <Text style={styles.placeholderText}>Logo</Text>
    </View>
  )
}

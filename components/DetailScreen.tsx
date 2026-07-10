import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export function DetailScreen({ title, subtitle, action, children }: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) {
  const router = useRouter();
  return <LinearGradient colors={[colors.bg, colors.bg2]} style={s.page}><SafeAreaView style={s.safe}>
    <View style={s.header}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={s.side}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable><View style={s.heading}><Text numberOfLines={1} style={s.title}>{title}</Text>{subtitle&&<Text numberOfLines={1} style={s.subtitle}>{subtitle}</Text>}</View><View style={[s.side,s.action]}>{action}</View></View>
    {children}
  </SafeAreaView></LinearGradient>;
}
const s=StyleSheet.create({page:{flex:1,alignItems:'center'},safe:{flex:1,width:'100%',maxWidth:560,borderLeftWidth:1,borderRightWidth:1,borderColor:colors.line},header:{height:60,paddingHorizontal:14,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:colors.line},side:{width:44,height:44,alignItems:'center',justifyContent:'center'},action:{marginLeft:'auto'},heading:{flex:1,alignItems:'center'},title:{color:colors.text,fontSize:16,fontWeight:'700'},subtitle:{color:colors.muted,fontSize:10,marginTop:2},});

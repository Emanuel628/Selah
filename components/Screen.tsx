import { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { useAppSettings } from '@/state/AppSettings';

export function Screen({ title, children }: PropsWithChildren<{ title: string }>) {
  const { darkMode } = useAppSettings();
  const displayTitle = ({ Read: 'Genesis 1', Garden: 'My Garden', Search: 'Global Search', You: 'Settings' } as Record<string,string>)[title] ?? title;
  const gradient = darkMode ? [colors.bg, colors.bg2] as const : ['#f4efe3', '#e7eee8'] as const;
  const text = darkMode ? colors.text : '#193029';
  const border = darkMode ? colors.line : 'rgba(25,48,41,0.12)';
  return <LinearGradient colors={gradient} style={s.backdrop}><SafeAreaView style={s.phone}>
    <View style={[s.header, { borderColor: border }]}><View style={s.brand}><MaterialCommunityIcons name="sprout" size={22} color={colors.green} /><Text style={[s.logo, { color: text }]}>Selah</Text></View><Text numberOfLines={1} style={[s.title, { color: text }]}>{displayTitle}</Text><View style={s.headerSpacer}/></View>
    {children}
  </SafeAreaView></LinearGradient>;
}
const s = StyleSheet.create({backdrop:{flex:1},phone:{flex:1,width:'100%'},header:{height:58,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center'},brand:{flexDirection:'row',gap:7,alignItems:'center',width:90},logo:{fontSize:18,fontWeight:'700'},title:{flex:1,textAlign:'center',fontSize:15,fontWeight:'600'},headerSpacer:{width:90}});

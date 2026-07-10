import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

export function MenuRow({ icon, title, subtitle, value, onPress, last }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; subtitle?: string; value?: string; onPress?: () => void; last?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[s.row,last&&s.last,pressed&&s.pressed]}><View style={s.icon}><Ionicons name={icon} size={19} color={colors.green}/></View><View style={s.copy}><Text style={s.title}>{title}</Text>{subtitle&&<Text style={s.subtitle}>{subtitle}</Text>}</View>{value&&<Text style={s.value}>{value}</Text>}<Ionicons name="chevron-forward" size={18} color={colors.muted}/></Pressable>;
}
const s=StyleSheet.create({row:{minHeight:60,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderColor:colors.line},last:{borderBottomWidth:0},pressed:{opacity:.65},icon:{width:34,height:34,borderRadius:10,backgroundColor:'rgba(92,169,135,.12)',alignItems:'center',justifyContent:'center'},copy:{flex:1},title:{color:colors.text,fontWeight:'600'},subtitle:{color:colors.muted,fontSize:11,marginTop:3},value:{color:colors.muted,fontSize:12}});

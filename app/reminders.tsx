import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { DetailScreen } from '@/components/DetailScreen';
import { colors } from '@/lib/theme';
import { useAppSettings } from '@/state/AppSettings';
import { ReminderTimePicker } from '@/components/ReminderTimePicker';

const dayLabels=['S','M','T','W','T','F','S'];
export default function Reminders(){
  const settings=useAppSettings();
  const [enabled,setEnabled]=useState(true);
  const [hour,setHour]=useState(settings.reminderHour);
  const [minute,setMinute]=useState(settings.reminderMinute);
  const [period,setPeriod]=useState<'AM'|'PM'>(settings.reminderPeriod);
  const [days,setDays]=useState(settings.reminderDays);
  const [saved,setSaved]=useState(false);
  const changeTime=(nextHour:number,nextMinute:string,nextPeriod:'AM'|'PM')=>{setHour(nextHour);setMinute(nextMinute);setPeriod(nextPeriod);setSaved(false)};
  const save=()=>{settings.setReminderHour(hour);settings.setReminderMinute(minute);settings.setReminderPeriod(period);settings.setReminderDays(days);setSaved(true)};
  return <DetailScreen title="Study rhythm"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
    <View style={s.enableRow}><View><Text style={s.enableTitle}>Daily Selah</Text><Text style={s.help}>A quiet invitation to return to Scripture.</Text></View><Switch value={enabled} onValueChange={value=>{setEnabled(value);setSaved(false)}} trackColor={{false:'#52645e',true:colors.green}} thumbColor="#eef3f0"/></View>
    <Text style={s.label}>TIME</Text>
    <ReminderTimePicker hour={hour} minute={minute} period={period} disabled={!enabled} onChange={changeTime}/>
    <Text style={s.label}>REMIND ME ON</Text><View style={[s.days,!enabled&&s.inactive]}>{dayLabels.map((day,index)=><Pressable disabled={!enabled} key={`${day}${index}`} onPress={()=>{setDays(current=>current.includes(index)?current.filter(i=>i!==index):[...current,index]);setSaved(false)}} style={[s.day,days.includes(index)&&s.dayActive]}><Text style={[s.dayText,days.includes(index)&&s.dayTextActive]}>{day}</Text></Pressable>)}</View>
    <Pressable onPress={save} style={s.save}><Text style={s.saveText}>{saved?'Saved ✓':'Save study rhythm'}</Text></Pressable>
    <Text style={s.note}>{saved?`Reminder saved for ${hour}:${minute} ${period}.`:'Changes are kept in this frontend session.'}</Text>
  </ScrollView></DetailScreen>
}
const s=StyleSheet.create({body:{padding:18,paddingBottom:30},enableRow:{backgroundColor:colors.surface,borderRadius:15,borderWidth:1,borderColor:colors.line,padding:15,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},enableTitle:{color:colors.text,fontWeight:'700'},help:{color:colors.muted,fontSize:11,marginTop:4},label:{color:colors.muted,fontSize:10,fontWeight:'700',letterSpacing:1.3,marginBottom:9},inactive:{opacity:.4},days:{flexDirection:'row',justifyContent:'space-between'},day:{width:38,height:38,borderRadius:19,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},dayActive:{backgroundColor:colors.green},dayText:{color:colors.muted,fontWeight:'700'},dayTextActive:{color:'#081712'},save:{backgroundColor:colors.green,borderRadius:12,padding:14,alignItems:'center',marginTop:28},saveText:{color:'#081712',fontWeight:'800'},note:{color:colors.muted,fontSize:11,textAlign:'center',marginTop:10}});

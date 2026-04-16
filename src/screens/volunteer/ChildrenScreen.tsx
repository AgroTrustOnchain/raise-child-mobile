import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';

const tasks = [
  {
    name: 'Samuel Okafor',
    region: 'Upper River Region',
    status: 'Overdue: 3 Days',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk7yAbhVeXgug3OgnOIqKL67fCt4YAc10Yj2zSIwstkcnMY6pI23X-QzSbLXnQvPQ3xs3tx32ppWAwLVjC3fy9FuK3peEwjJG7yQ5_K0C8XvtZYOR4P17s8bB66ghJ7RIdzym5M6g7iS5rpeZeTImc5q9ttdrt3bOT7OOOozOjmcvEFRqj4kTfq4mFmPYV1gWI08GUxnPlZUfHFWpgLPhR-6zEEbUjERxJPpzV_0-aLffA8n46U0d_t_MKApaD12lWqk3jtqbG9v2v',
    type: 'overdue'
  },
  {
    name: 'Amara Kouyaté',
    region: 'Northern District',
    status: 'Due Today',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi-44r6BEYafm8w45KQ5eltLWj1qYYR0gtlRKClDCydKes0s3Wb5qJaTGmQpks4JH2986ZsVHrmayoKjCoii8vqI5iQZhn6oXxM6Mhot6tR1IkykEga0k07qFPfNB85VpcqTo0_efdQtcBtafd95Dwebn_cv1POxFpKizD1JP9y5belWE39RIUMrH7-v6O4nrdtOTjqGKUXHBPhxKMswUArLpToUt8jkbudpA6GCoHFwqISsirOyVSLx46ypvpWsZ2L3jXhqOALQDS',
    type: 'today'
  },
  {
    name: 'Moussa Diop',
    region: 'Central Farmlands',
    status: 'Overdue: 1 Day',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr31uCRwCxlEX3jjnD0Wajtc9bbw78tzO9Ga-JxXpDpSpvhaHDXE3TvmG7bOKqq1LY-I3EdtVQS5_LnNVBvhLpQGjYTQ9eBH1Kh0CWnM6dQmpop-hWOZBEY9YuL06VhUDEOEGQfhY2GqJ3NRjneCBa4mOz85zN-lRsOWZt0we39NYP6_C5kpmsQrffKE0Bqren6Rti6H17W_NZVAUkNQU-C6G5PL5snkIqdDZ163RHwIWfHKO8BpvTvPffPq5aKbtcuAIm2akXsSon',
    type: 'overdue'
  }
];

export default function ChildrenScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <Text style={styles.title}>Welfare Tasks</Text>
        <Text style={styles.subtitle}>
          Maintaining stewardship for children across regions.
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, styles.overdueBox]}>
            <Text style={[styles.statNumber, { color: '#fff' }]}>04</Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Overdue</Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search by name or region..."
          style={styles.search}
        />

        {/* Task Cards */}
        {tasks.map((task, index) => (
          <View key={index} style={styles.card}>
            <Image source={{ uri: task.image }} style={styles.image} />

            <View style={styles.badgeContainer}>
              <Text style={[
                styles.badge,
                task.type === 'overdue' ? styles.badgeOverdue : styles.badgeToday
              ]}>
                {task.status}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.name}>{task.name}</Text>
              <Text style={styles.region}>{task.region}</Text>

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Upload Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00288e'
  },
  subtitle: {
    color: '#666',
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  statBox: {
    backgroundColor: '#e6eeff',
    padding: 12,
    borderRadius: 12,
    marginRight: 10
  },
  overdueBox: {
    backgroundColor: '#fd761a'
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 12
  },
  search: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 180
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 'bold'
  },
  badgeOverdue: {
    backgroundColor: '#fd761a',
    color: '#fff'
  },
  badgeToday: {
    backgroundColor: '#00288e',
    color: '#fff'
  },
  cardContent: {
    padding: 12
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  region: {
    color: '#666',
    marginBottom: 10
  },
  button: {
    backgroundColor: '#00288e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

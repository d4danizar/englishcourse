// src/constants/syllabus.ts

export const TOPIC_DISCUSSION_1 = [
  "Hobby", "School", "Cooking", "Restaurant", "Bag", "Lost & Found", "Money and Happiness",
  "Saving Money", "Countries", "Beach", "City", "Public Figure", "Job", "Work from Café (WFC)",
  "Work from Office (WFO)", "Traveling", "Picnic", "Public Park", "Library", "Farm",
  "Gardening", "Perfume", "Cold Weather", "Hot Weather", "Foreign Friend", "Game", "Pet",
  "Traveling Abroad", "Birthday", "Work Out", "Fashion", "Study", "Long Distance Relationship (LDR)",
  "Countryside", "Podcast", "Journaling", "Dealing with Stress", "Me-time", "Traffic Jam", "DIY (Do It Yourself)"
];

export const LISTENING = [
  "First Snow Fall", "Jessica First Day of School", "My Flower Garden", "Going Camping", "My House",
  "My First Pet", "Jennifer The Firefighter", "Joe’s First Car", "Summer Vacation", "Cleaning Up Leaves",
  "Halloween Night", "Learning How to Drive", "Housework", "Daily Schedules", "Meals", "Seasons",
  "Weather", "Introducing Yourself to a Classmate", "Finding a Nearby Cafe", "Ordering Breakfast at a Cafe",
  "Introducing Yourself in a Job Interview", "First Day at a New Job", "Introducing Yourself to a New Neighbour",
  "Small Talk in a Taxi", "Talking about Experiences", "Talking about a New Job", "Social Media",
  "Describing Places", "Story at The Zoo", "Titanium", "Beautiful in White", "My Love",
  "Don’t You Remember", "Just The Way You Are", "Count on Me", "Tears in Heaven", "Die With a Smile",
  "I Have a Dream", "Fight Song", "Roar"
];

export const TELLING_PICTURE = [
  "Holiday and Vacation!", "After School", "Studying", "Gardening", "Lunch with Family",
  "Daily Routines", "Sports", "Old Couple", "Directions", "Smartphone", "Workplace",
  "Starting the Day", "Traditional Market", "Bank", "Band", "Farmer", "Hiking", "Group Work",
  "Feeling Sick", "Classroom", "Swimming", "Newlyweds", "Fishing", "Watching Movie",
  "Public Transportation", "Journalist", "Listen to Music", "Natural Disaster", "Ordering Food",
  "Space", "Camping", "Playing in the Snow", "Flag Ceremony", "Delivery", "Homeless",
  "Cooking", "Traffic", "Stress at Work", "Concert", "Under the Sea"
];

export const TOPIC_DISCUSSION_2 = [
  "Social Media", "Disease", "Season", "Kitchen", "Movie", "Music", "Work-Life Balance",
  "River", "Waterfall", "Swimming Pool", "Fast Food", "Daily Activities", "Relationships",
  "Shopping", "Weekends", "Idol", "Childhood", "Jogging", "House", "Handphones", "Bullying",
  "Free Time", "High School Times", "Sport", "Bank", "Books", "Family", "Party", "Technology",
  "Habits", "Public Transportation", "Education", "Lifestyle", "Traditions", "Furniture",
  "News", "Languages", "Environment", "Public Place", "Market"
];

// Helper maps
export const TIMESLOT_TO_SESSION: Record<string, number> = {
  "08:00 - 09:30": 1,
  "10:00 - 11:30": 2,
  "12:30 - 14:00": 3,
  "14:30 - 16:00": 4,
  "16:30 - 18:00": 5, // Mengulang Modul 1
  "18:30 - 20:00": 6,
};

export const SESSION_MODULE_MAP: Record<number, { name: string, shortName: string, data: string[] }> = {
  1: { name: "Topic Discussion 1", shortName: "TD1", data: TOPIC_DISCUSSION_1 },
  2: { name: "Listening", shortName: "LST", data: LISTENING },
  3: { name: "Telling Picture", shortName: "TP", data: TELLING_PICTURE },
  4: { name: "Topic Discussion 2", shortName: "TD2", data: TOPIC_DISCUSSION_2 },
  5: { name: "Topic Discussion 1", shortName: "TD1", data: TOPIC_DISCUSSION_1 },
  6: { name: "Listening", shortName: "LST", data: LISTENING },
};
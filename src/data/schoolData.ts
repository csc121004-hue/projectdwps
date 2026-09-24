export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  altText: string;
  colSpan?: string;
  height?: string;
}

export interface InquiryRecord {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  grade: string;
  message?: string;
  date: string;
  status: 'New' | 'Under Review' | 'Contacted' | 'Tour Scheduled' | 'Admission Offered' | 'Enrolled';
  notes?: string;
  priority?: 'High' | 'Normal';
  followUpDate?: string;
}

export interface NewsletterItem {
  id: string;
  title: string;
  edition: string; // e.g. "Vol. 14 • Spring 2026 Edition"
  publishDate: string; // e.g. "2026-04-05"
  category: 'Academics & STEM' | 'Sports & Athletics' | 'Campus Life & Arts' | 'Special Bulletin';
  coverImageUrl: string;
  summary: string;
  content: string;
  author: string;
  isLive: boolean; // Controls whether it appears on public website
  highlights: string[];
  pdfDownloadUrl?: string;
  tags?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Leadership' | 'Faculty';
  imageUrl: string;
  description?: string;
  qualifications?: string;
  experience?: string;
  subjects?: string[];
}

export const SCHOOL_INFO = {
  name: 'Disney World Public School',
  shortName: 'DWPS Ballabgarh',
  motto: 'Knowledge is Our Magic',
  locationTag: 'Subhash Colony, Ballabgarh',
  address: '1008, Gali no-11, Subhash Colony, Ballabgarh, Faridabad - 121004, Haryana, India',
  landmark: 'Subhash Colony Hub',
  phone: '+91-9899638676',
  email: 'dwpsballabgarh@gmail.com',
  whatsappNumber: '919899638676',
  officeHours: 'Mon - Sat (8:00 AM – 2:00 PM)',
  academicYear: '2026-27',
  director: {
    name: 'Mr. Rahul Chaudhary',
    title: 'Founder / Director',
    school: 'Disney World Public School',
    quote: 'At Disney World Public School, we believe that a school is only as good as its teachers. Our team consists of highly qualified, experienced, and passionate educators who are dedicated to the holistic development of every child.'
  },
  social: {
    facebook: 'https://www.facebook.com/dwpsballabgarh',
    instagram: 'https://www.instagram.com/dwpsballabgarh',
    handle: '@dwpsballabgarh'
  }
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'charan-singh-ghanghas',
    name: 'Ch. Charan Singh Ghanghas',
    role: 'President',
    category: 'Leadership',
    imageUrl: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/gemini_generated_image_c7ggdic7ggdic7gg-rjE3nTZVAfXcxWy4.png',
    description: 'Visionary leadership guiding Disney World Public School with values of ethical education, discipline, and community upliftment in Ballabgarh.',
    qualifications: 'Institutional Patron & Community Leader',
    experience: 'Decades of community service & educational advocacy'
  },
  {
    id: 'rahul-chaudhary',
    name: 'Mr. Rahul Chaudhary',
    role: 'Founder / Director',
    category: 'Leadership',
    imageUrl: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/img_20250521_080047-TBvk3l0f6rlrIpn9.jpg',
    description: 'Pioneering modern, child-centered schooling in Subhash Colony, ensuring state-of-the-art facilities, compassionate pedagogy, and constant faculty growth.',
    qualifications: 'Post Graduate in Educational Administration',
    experience: '12+ Years in School Leadership & Academic Management'
  },
  {
    id: 'neelam',
    name: 'Ms. Neelam',
    role: 'Principal & Co-Founder',
    category: 'Leadership',
    imageUrl: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/gemini_generated_image_smyx6ksmyx6ksmyx-Yc5UrttjvLJ6k33X.png',
    description: 'Dedicated to cultivating academic excellence, character building, and individual mentorship for every student from early foundation to grade school.',
    qualifications: 'M.A., B.Ed., Educational Leadership Certified',
    experience: '15+ Years in Pedagogy & Curriculum Innovation'
  },
  {
    id: 'anuradha',
    name: 'Ms. Anuradha',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/anuradha.jpg',
    description: 'Inspiring young learners with interactive classroom instruction, language fluency development, and engaging experiential activities.',
    qualifications: 'B.A., B.Ed.',
    subjects: ['Language Arts', 'Environmental Studies', 'Social Skills']
  },
  {
    id: 'bhavna',
    name: 'Ms. Bhavna',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/bhavna.jpg',
    description: 'Fostering joyful foundational learning through interactive literacy activities, logic exercises, and hands-on creative crafts.',
    qualifications: 'B.Sc., B.Ed.',
    subjects: ['Early Childhood Literacy', 'Logic', 'Puzzles', 'Art & Craft']
  },
  {
    id: 'mamta',
    name: 'Ms. Mamta',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/mamta.jpg',
    description: 'Specializing in early childhood cognitive and motor development, phonics mastery, and creative storytelling in a nurturing atmosphere.',
    qualifications: 'N.T.T., B.A.',
    subjects: ['Early Childhood Literacy', 'Phonics', 'Creative Expression']
  },
  {
    id: 'anjali',
    name: 'Ms. Anjali',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/anjali.jpg?v=2',
    description: 'Dedicated mathematics educator demystifying numbers, cultivating logical reasoning, mental math agility, and real-world problem-solving.',
    qualifications: 'B.Sc. (Mathematics), B.Ed.',
    subjects: ['Mathematics', 'Mental Math', 'Logical Reasoning']
  },
  {
    id: 'krishna',
    name: 'Ms. Krishna',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop/UmKLUfDB0p4bPZYE/gemini_generated_image_gxwwckgxwwckgxww-k6zuK3wqEC0Lixia.png',
    description: 'Guiding primary students through interactive multimedia smart classroom lessons and encouraging holistic participation in school fests.',
    qualifications: 'B.Com., B.Ed.',
    subjects: ['English Comprehension', 'Social Studies', 'Digital Lessons']
  },
  {
    id: 'neha',
    name: 'Ms. Neha',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/neha.jpg?v=2',
    description: 'Integrating environmental awareness with foundational digital literacy, teaching students respect for nature alongside computer fundamentals and IT skills.',
    qualifications: 'B.C.A., B.Ed.',
    subjects: ['EVS & Computer', 'Environmental Studies', 'Computer Fundamentals']
  },
  {
    id: 'geeta',
    name: 'Ms. Geeta',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/geeta.jpg?v=2',
    description: 'Guiding UKG learners through foundational early childhood literacy, systematic phonics, speech clarity, and joyous expressive learning.',
    qualifications: 'N.T.T., B.A., Early Childhood Education Specialist',
    subjects: ['UKG', 'Early Childhood Literacy', 'Phonics']
  },
  {
    id: 'pavitra',
    name: 'Ms. Pavitra',
    role: 'Teacher',
    category: 'Faculty',
    imageUrl: '/assets/faculty/pavitra.jpg?v=2',
    description: 'Dedicated early childhood educator cultivating foundational literacy, joyful vocabulary building, storytelling confidence, and phonics mastery.',
    qualifications: 'N.T.T., B.A., Early Childhood Education Certified',
    subjects: ['Early Childhood Literacy', 'Phonics & Vocabulary', 'Creative Storytelling']
  }
];

export const HOTLINK_IMAGES = {
  crestLogo: '/assets/dwps_logo.svg',
  heroClassroom: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAOKnBpektqvmdGtqeMZOyQDSFXaH1src42IU9xqiKP8rZz3j4ckH0cN_0sZeOG6tmbXUIV-b9RkLWNcdBVQJpaI5sqAbkQAF6t4AZa12jiqAJzAHFbqpVCLw2p3KWcZrtciTqKoaMVLm6oS6Hb9DOYO232bXAQmWQLh_Tzi9jyRkeP9ud1UD02rW-8z4s1FV0iZr4ypec6pI0UDzUhxVxPgwdaLCqsxSz08IytsSvXHuvFbC6hbTs',
  scienceExhibition: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAglcFAHIBE-lCGFDRXQTD6One8H6VsFEdncdPihNCy2ptyAzS4CC9_g8mCZz3ZjT9pbD79oLAOFq4V9a8l2rF1TmQTjEgyapp2B_YjnyXTxcPPNkNU92CiF-7uZAt5TnqBs6XzX3yfxWDfXSQ60DZNTfblLjCYUVfEiw17t4GnNRuS5sbDk7wCcAciyMF01Ly0MFjgHRGIdPbC3FXppfpKuTZVsuiIcCeJlGjEQaiCP8PoaxlJ13_1',
  earlyChildhood: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkk9mme-f5HV2WRVvQhIgR62KAUxl1bmBDn48USXFbK3fDOQjZ6BbMQjYlm_x_P-5tF4jBo8TyBjQMmYjLPnagnEEqq16SzFiSsRC3fZ5w9emnJmyBXMnorSRNuo2rgHqnwobIITkGWqaY_MBLm2E32m_7XNzTwWFlJyJmL6HBkj2toDhz09LenFmAgyTia26JezdWTGas0m8ZV-48hqVRMCGuQNyAau5mQwGGKAsEhyS7eOJTUkQx',
  sportsRelay: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGWR5V_C53jvD3Dzn7PaOw-BaCS-LME-4gz2u1vBzgng06KuO4wND6EdIkoCUcUSW5VuR6D0JK0HLCBmDt0uADUH8J9o3f52-bubkh41otdH89tvg5S9SxmI5NYd64zd-Yv_Gd9Z1HLOYnPnACnvdkbzSxrTB4w5ZboJqM-TFkALe3FbwuZ8PdZCxpEnff7cgtC3wswfV6zj9p7usvvio-dInnAV5bkOzRg9ZJYA5Cm2XL3lIbkS46',
  smartClassroom: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw-1SMdgnlJMhjwmzqXo90mSrQDBWkRzfyam0p4JZ0cUPYDcNGe6hnhFkXWP143drmJgNtt0nb0q0bwUq3a9cLZX0zAGimtJWatLYVmgoUxQP1DrNFbat94klv0e-y1BpWC6okRTV-vQr6SY7AIk7lzmgrjGHufKl73AGcq_5-YNw4nQodCAjTpoX8zHmFn9H6Gu7dJiRQcqcNuVbc5VgceioFM8Y-sMsYUVLnahiC13xnz8KhftHt',
  annualDay: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD82YKAcVWpJvgU1QPrq_IQRgxK63aLWcex4nqy2aSLg65Vw6bBCpWRYASlNvouoiEp5Hcbb36wJjIP9AqIlnExsrpAlfB2e9-R6ley7dOIjJ5bLCHpMqs6_vuHxfTgQdS0EYARkdYUUQzTlSAc_a6AQD0oKfucaGjtDcHjONIY83cDWdfLKxKwseSPpxAT5PWJd62V8S0qm5ZQL7aKJlnvZMMzWIxxE2nIhDb46I1TN6mI_6TgB3D2'
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'science-fair',
    title: 'Curiosity Ignited Through Hands-on Discovery',
    subtitle: 'Annual Science & Arts Exhibition',
    category: 'STEM & Academics',
    imageUrl: HOTLINK_IMAGES.scienceExhibition,
    altText: 'Lively group of elementary students engaged in an interactive STEM science fair experiment inside a spacious modern hall.',
    colSpan: 'md:col-span-8',
    height: 'h-80 lg:h-96'
  },
  {
    id: 'early-childhood',
    title: 'Foundational Literacy & Play',
    subtitle: 'Early Childhood Joy',
    category: 'Pre-Primary',
    imageUrl: HOTLINK_IMAGES.earlyChildhood,
    altText: 'Pre-primary kindergarten children sitting on soft educational mats in a vibrantly decorated nursery classroom playing with alphabet blocks.',
    colSpan: 'md:col-span-4',
    height: 'h-80 lg:h-96'
  },
  {
    id: 'sports-day',
    title: 'Teamwork On the Field',
    subtitle: 'Sports & Physical Stamina',
    category: 'Athletics',
    imageUrl: HOTLINK_IMAGES.sportsRelay,
    altText: 'Young school children running a friendly relay race on an outdoor athletic sports ground during annual sports day.',
    colSpan: 'md:col-span-4',
    height: 'h-72'
  },
  {
    id: 'smart-class',
    title: 'Interactive Digital Learning',
    subtitle: 'Smart Classrooms',
    category: 'Technology',
    imageUrl: HOTLINK_IMAGES.smartClassroom,
    altText: 'Focused primary grade school students writing in notebooks while looking attentively at a high-definition interactive digital chalkboard.',
    colSpan: 'md:col-span-4',
    height: 'h-72'
  },
  {
    id: 'annual-day',
    title: 'Culture & Performing Arts',
    subtitle: 'Annual Day Celebrations',
    category: 'Cultural',
    imageUrl: HOTLINK_IMAGES.annualDay,
    altText: 'Primary students performing an expressive traditional Indian cultural folk dance on a decorated auditorium stage.',
    colSpan: 'md:col-span-4',
    height: 'h-72'
  }
];

export const CURRICULUM_TIERS = [
  {
    id: 'pre-primary',
    name: 'Pre-Primary & Early Years',
    badge: 'Playgroup • Nursery • KG',
    ages: 'Age 2.5 – 5 Years',
    icon: 'toys',
    description: 'Activity-based learning centered around natural curiosity. We build foundational literacy, numeracy, motor skills, and social confidence through joyful cognitive play.',
    points: [
      'Montessori-inspired sensory activity modules',
      'Phonics, storytelling & vocabulary expansion',
      'Expressive arts, music, rhythm and dance',
      'Fine and gross motor skills play arena'
    ],
    ratio: '1:15',
    timings: '8:30 AM – 12:30 PM'
  },
  {
    id: 'primary',
    name: 'Primary School Wing',
    badge: 'Grades 1 to 5',
    tag: 'Core Milestone',
    ages: 'Age 6 – 10 Years',
    icon: 'menu_book',
    description: 'Structured inquiry that cultivates conceptual clarity in STEM, language fluency, environmental consciousness, and expressive artistic talents.',
    points: [
      'Experiential mathematics & introductory science',
      'Bilingual proficiency (English & Hindi)',
      'Interactive computer and digital smart lessons',
      'Theme-based project exhibitions and field trips'
    ],
    ratio: '1:25',
    timings: '8:00 AM – 1:45 PM'
  },
  {
    id: 'middle',
    name: 'Middle & Grade School',
    badge: 'Grade School',
    ages: 'Age 11 – 14 Years',
    icon: 'workspace_premium',
    description: 'Nurturing analytical thinking, collaborative project investigations, ethical leadership, and disciplined study habits required for future academic excellence.',
    points: [
      'Advanced problem-solving & science lab projects',
      'Debate, creative writing & public speaking',
      'Physical education, sports tournaments & yoga',
      'Coding foundations, robotics basics & digital ethics'
    ],
    ratio: '1:25',
    timings: '8:00 AM – 2:00 PM'
  }
];

export const BUS_ROUTES = [
  { route: 'Route 1', coverage: 'Subhash Colony - Chawla Colony - Sector 2 Market - Ballabgarh Bus Stand', stops: 8 },
  { route: 'Route 2', coverage: 'Adarsh Nagar - Sector 3 - Tigaon Road - DWPS Campus', stops: 7 },
  { route: 'Route 3', coverage: 'Faridabad By-Pass - YMCA Chowk - Subhash Colony Main Road', stops: 9 },
  { route: 'Route 4', coverage: 'Jharsethli - Badrola - Ballabgarh Railway Station Link - Campus', stops: 6 }
];

export interface SchoolAnnouncement {
  id: string;
  category: 'Admissions' | 'Events' | 'Academic' | 'Sports' | 'Achievement' | 'Notice';
  title: string;
  date: string;
  badge: string;
  summary: string;
  linkText?: string;
  isUrgent?: boolean;
}

export const SCHOOL_ANNOUNCEMENTS: SchoolAnnouncement[] = [
  {
    id: 'ann-1',
    category: 'Admissions',
    title: 'Admissions Open 2026-27 (Playgroup to Grade 8)',
    date: 'March 2026',
    badge: 'Open Now',
    summary: 'Limited seats available. Special concession for siblings and early registrations.',
    linkText: 'Apply Now',
    isUrgent: true
  },
  {
    id: 'ann-2',
    category: 'Events',
    title: 'Annual Sports & Athletics Meet 2026',
    date: 'April 18, 2026',
    badge: 'Upcoming',
    summary: 'Track sprints, relay challenges, and martial arts demonstrations at the campus sports field.',
    linkText: 'View Schedule'
  },
  {
    id: 'ann-3',
    category: 'Academic',
    title: 'STEM Science & Robotics Discovery Fair',
    date: 'April 25, 2026',
    badge: 'Exhibition',
    summary: 'Student working models, automated robots, and environmental green science demonstrations.',
    linkText: 'Event Details'
  },
  {
    id: 'ann-4',
    category: 'Events',
    title: 'Interactive Parent-Teacher Orientation (PTM)',
    date: 'May 02, 2026',
    badge: 'Orientation',
    summary: 'Orientation for new admissions 2026-27 and holistic progress evaluations for existing students.',
    linkText: 'Book Slot'
  },
  {
    id: 'ann-5',
    category: 'Achievement',
    title: 'DWPS Students Secure 7 Medals in Haryana Inter-School Championship',
    date: 'March 2026',
    badge: 'Proud Moment',
    summary: 'Our young athletes won 4 Gold, 2 Silver, and 1 Bronze in regional athletics & chess tournaments.',
    linkText: 'Read More'
  },
  {
    id: 'ann-6',
    category: 'Academic',
    title: 'Smart Classroom & AI-Enabled Learning Upgrade',
    date: 'New Session',
    badge: 'Facility',
    summary: 'Interactive audiovisual panels and digital math labs operational across all classrooms.',
    linkText: 'Explore Labs'
  }
];

export interface GradeFeeStructure {
  id: string;
  gradeName: string;
  category: 'Early Years' | 'Primary Wing' | 'Middle Wing';
  ageGroup: string;
  monthlyTuition: number;
  annualCharges: number; // divided into quarterly or yearly
  activitySmartClass: number; // per month
  admissionFee: number; // one-time
  securityDeposit: number; // refundable
  description: string;
  features: string[];
}

export const GRADE_FEE_STRUCTURES: GradeFeeStructure[] = [
  {
    id: 'playgroup',
    gradeName: 'Playgroup (Toddlers)',
    category: 'Early Years',
    ageGroup: '2.5 – 3.5 Years',
    monthlyTuition: 2600,
    annualCharges: 3500,
    activitySmartClass: 400,
    admissionFee: 4000,
    securityDeposit: 1500,
    description: 'Montessori play modules, gross motor skills play arena, sensory toy learning, and storytelling.',
    features: ['1:15 Student-Teacher Ratio', 'Child-Safe Soft Play Area', 'Mid-day healthy snack monitoring', 'Air-cooled child suites']
  },
  {
    id: 'nursery',
    gradeName: 'Nursery',
    category: 'Early Years',
    ageGroup: '3.5 – 4.5 Years',
    monthlyTuition: 2800,
    annualCharges: 3800,
    activitySmartClass: 450,
    admissionFee: 4500,
    securityDeposit: 1500,
    description: 'Early childhood phonics, numeracy readiness, creative arts, rhythm, and social confidence building.',
    features: ['Phonics & Pre-reading Modules', 'Interactive smart audiovisuals', 'Indoor & outdoor recreation', 'Parent consultation portal']
  },
  {
    id: 'kg-prep',
    gradeName: 'KG / Kindergarten (Prep)',
    category: 'Early Years',
    ageGroup: '4.5 – 5.5 Years',
    monthlyTuition: 3000,
    annualCharges: 4000,
    activitySmartClass: 500,
    admissionFee: 4500,
    securityDeposit: 1500,
    description: 'Foundational literacy in English & Hindi, practical math concepts, expressive speaking, and fine arts.',
    features: ['Bilingual speech foundations', 'Early STEM science puzzles', 'Music, dance & physical fitness', 'Smooth Grade 1 transition kit']
  },
  {
    id: 'grade-1-2',
    gradeName: 'Grade 1 & 2',
    category: 'Primary Wing',
    ageGroup: '5.5 – 7.5 Years',
    monthlyTuition: 3300,
    annualCharges: 4500,
    activitySmartClass: 550,
    admissionFee: 5000,
    securityDeposit: 2000,
    description: 'Formal CBSE aligned curriculum with interactive digital boards, foundational arithmetic, and environmental studies.',
    features: ['Smart Classroom Digitization', 'Math lab & hands-on manipulatives', 'Weekly sports & physical training', 'Reading club & library access']
  },
  {
    id: 'grade-3-5',
    gradeName: 'Grade 3 to 5',
    category: 'Primary Wing',
    ageGroup: '7.5 – 10.5 Years',
    monthlyTuition: 3600,
    annualCharges: 4800,
    activitySmartClass: 600,
    admissionFee: 5000,
    securityDeposit: 2000,
    description: 'Conceptual STEM science, English vocabulary mastery, computer lab literacy, and competitive sports.',
    features: ['Computer & Coding basics', 'Science experimentation kits', 'Public speaking & debate rounds', 'Inter-house competitions']
  },
  {
    id: 'grade-6-8',
    gradeName: 'Middle School (Grade 6 to 8)',
    category: 'Middle Wing',
    ageGroup: '11 – 14 Years',
    monthlyTuition: 4000,
    annualCharges: 5200,
    activitySmartClass: 700,
    admissionFee: 5500,
    securityDeposit: 2500,
    description: 'Rigorous academic preparation, advanced science projects, digital design, and leadership initiatives.',
    features: ['Advanced Science & Math labs', 'Robotics & STEM projects', 'Co-curricular sports coaching', 'Career guidance & Olympiad prep']
  }
];

export const INITIAL_INQUIRIES: InquiryRecord[] = [
  {
    id: 'INQ-2026-081',
    studentName: 'Aarav Sharma',
    phone: '+91 98996 38676',
    email: 'sharma.family@gmail.com',
    grade: 'KG / Prep',
    message: 'Looking for campus transport from Chawla Colony and fee structure.',
    date: '2026-03-21',
    status: 'Tour Scheduled',
    notes: 'Parent interested in bus stop at Chawla Colony main chowk. Campus tour fixed for Friday 10:30 AM.',
    priority: 'High',
    followUpDate: '2026-03-25'
  },
  {
    id: 'INQ-2026-079',
    studentName: 'Ananya Verma',
    phone: '+91 98112 45890',
    email: 'kverma.lead@outlook.com',
    grade: 'Grade 1',
    message: 'Transferring from Delhi branch. Need admission process details.',
    date: '2026-03-20',
    status: 'Contacted',
    notes: 'Counselor called father; explained document list & TC requirements. Awaiting TC submission.',
    priority: 'Normal',
    followUpDate: '2026-03-26'
  },
  {
    id: 'INQ-2026-072',
    studentName: 'Kabir Rawat',
    phone: '+91 98730 22341',
    email: 'rawat.k@yahoo.com',
    grade: 'Nursery',
    message: 'Inquiring about teacher-student ratio and daycare availability.',
    date: '2026-03-19',
    status: 'Admission Offered',
    notes: 'Interaction completed with mother. Recommended for Nursery. Seat blocked until March 30.',
    priority: 'High'
  },
  {
    id: 'INQ-2026-068',
    studentName: 'Ridhima Bhati',
    phone: '+91 99920 18452',
    email: 'sunilbhati.ballabgarh@gmail.com',
    grade: 'Playgroup',
    message: 'Seeking admission for 2.5-year-old toddler. Subhash Colony resident.',
    date: '2026-03-18',
    status: 'Enrolled',
    notes: 'Registration fee paid, birth certificate verified. Uniform and starter kit issued.',
    priority: 'Normal'
  },
  {
    id: 'INQ-2026-065',
    studentName: 'Devansh Tewatia',
    phone: '+91 98188 64201',
    email: 'rtewatia.corp@gmail.com',
    grade: 'Grade 3',
    message: 'Interested in STEM robotics club and school bus route from Sector 3.',
    date: '2026-03-17',
    status: 'Under Review',
    notes: 'Diagnostic assessment scheduled for English & Math this Saturday.',
    priority: 'Normal',
    followUpDate: '2026-03-28'
  },
  {
    id: 'INQ-2026-061',
    studentName: 'Meera Chawla',
    phone: '+91 97170 55129',
    email: 'chawla.meera.admissions@gmail.com',
    grade: 'Grade 6',
    message: 'Relocating to Ballabgarh. Looking for middle school curriculum details and science labs.',
    date: '2026-03-16',
    status: 'New',
    notes: 'Online inquiry received via website fee calculator. Pending initial counselor callback.',
    priority: 'High',
    followUpDate: '2026-03-23'
  }
];

export const INITIAL_NEWSLETTERS: NewsletterItem[] = [
  {
    id: 'nl-2026-04',
    title: 'The DWPS Chronicle: Welcoming Academic Session 2026-27 with Renewed Magic',
    edition: 'Vol. 14 • Spring 2026 Edition',
    publishDate: '2026-04-05',
    category: 'Academics & STEM',
    coverImageUrl: HOTLINK_IMAGES.smartClassroom,
    summary: 'A special look into our newly upgraded interactive digital classrooms, AI-curiosity modules, teacher orientation workshops, and welcoming message from Director Mr. Rahul Chaudhary.',
    content: `### Welcome to Academic Session 2026-27 at Disney World Public School!

We are thrilled to welcome both returning students and enthusiastic new families stepping into our Subhash Colony campus for Session 2026-27. Guided by our motto **"Knowledge is Our Magic"**, this academic year marks substantial milestones in modern, child-centered schooling.

#### 1. Interactive Smart Classroom Upgrades
Every classroom across Pre-Primary, Primary, and Middle Wings has now been fitted with next-generation interactive touch displays, multimodal learning aids, and age-adapted digital labs that bring abstract concepts to vibrant visual life.

#### 2. Faculty Pedagogy Workshop
Our faculty team participated in a rigorous 5-day pedagogy symposium focused on the National Education Policy (NEP 2020) foundational stage, joy-based mathematics manipulatives, and socio-emotional mentorship.

#### 3. Message from the Leadership Desk
*"A school is only as transformative as the curiosity it awakens in every child. We assure every parent that DWPS Ballabgarh is a place of boundless encouragement, ethical grounding, and joyful discovery."*
— **Mr. Rahul Chaudhary, Founder & Director**`,
    author: 'Editorial Desk & Principal Ms. Neelam',
    isLive: true,
    highlights: [
      '100% smart classroom digitization completed across all wings',
      'Child-safe GPS transportation fleet deployed with live mobile tracking',
      'NEP 2020 experiential learning modules for Playgroup through Grade 8',
      'Admissions helpline open 8:00 AM - 2:00 PM Monday through Saturday'
    ],
    pdfDownloadUrl: '#',
    tags: ['Academic Launch', 'Smart Classrooms', 'NEP 2020', 'Director Note']
  },
  {
    id: 'nl-2026-03',
    title: 'Annual Sports & Athletics Gala: Champions of Character, Grit & Team Spirit',
    edition: 'Vol. 13 • Annual Sports Special',
    publishDate: '2026-03-28',
    category: 'Sports & Athletics',
    coverImageUrl: HOTLINK_IMAGES.sportsRelay,
    summary: 'Highlighting standout track events, inter-house relays, yoga demonstrations, and our medal tally from the Haryana District Inter-School Tournament.',
    content: `### Champions of Disney World Public School Shine on Track & Turf!

The annual athletic carnival brought together over 350 enthusiastic young athletes, cheering parents, and dedicated coaches in a vibrant display of sportsmanship, endurance, and camaraderie.

#### Outstanding Highlights:
- **Red Phoenix House** lifted the Overall Championship Trophy with gold finishes in 100m relay, long jump, and obstacle races.
- **Pre-Primary Toddlers Fun Run**: The nursery obstacle race and sack bounce brought radiant smiles across the audience.
- **District Inter-School Laurels**: 7 DWPS student athletes secured medals in the Faridabad Inter-School Track & Taekwondo tournaments.

Physical fitness, fair play, and emotional resilience will always remain foundational pillars of student life at DWPS Ballabgarh.`,
    author: 'Sports Department & House Mentors',
    isLive: true,
    highlights: [
      'Red Phoenix House named Overall Sports Champions 2026',
      '7 District medals secured in Taekwondo, Speed Sprint, and Yoga',
      '100% student participation in annual drill and athletics',
      'Special felicitation for parent-child fun races'
    ],
    pdfDownloadUrl: '#',
    tags: ['Sports Gala', 'District Medals', 'Physical Fitness', 'House Cup']
  },
  {
    id: 'nl-2026-02',
    title: 'STEM Discovery & Junior Innovators Fair: Hands-On Science and Creative Robotics',
    edition: 'Vol. 12 • Winter Science Edition',
    publishDate: '2026-02-15',
    category: 'Campus Life & Arts',
    coverImageUrl: HOTLINK_IMAGES.scienceExhibition,
    summary: 'Students from Grade 1 to 8 showcased over 45 working science projects, eco-friendly models, hydraulic lifts, and automated robotics prototypes.',
    content: `### Young Scientists and Creative Thinkers at DWPS!

Our annual STEM Exhibition brought classroom theory to practical innovation. Parents and guest educators were amazed by the clarity and articulate presentations given by students as young as Grade 2.

#### Featured Student Projects:
1. **Eco-Clean Smart Water Filtration**: Designed by Grade 5 students using natural porous charcoal and solar aeration.
2. **Automated Solar Streetlight Sensor**: Practical circuit board programming by Grade 7 electronics club.
3. **Biodegradable Seed Paper Initiative**: Primary wing initiative distributing plantable wildflower bookmarks to visitors.

We congratulate every young researcher, their teacher mentors, and supportive parents who nurtured these imaginative experiments!`,
    author: 'Science & Innovation Faculty',
    isLive: true,
    highlights: [
      '45+ working student science models exhibited',
      'Solar circuit demonstration by Grade 7 Robotics Club',
      'Eco-friendly seed-paper distribution drive',
      'Interactive parent science quiz and puzzle arena'
    ],
    pdfDownloadUrl: '#',
    tags: ['Science Fair', 'STEM', 'Robotics', 'Eco Innovation']
  }
];

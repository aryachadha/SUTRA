require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { evaluateProjectConflict } = require('../server/services/conflictDetector');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding synthetic demonstration data for Jaipur Municipal Region...');

  // 1. Seed Departments
  const departmentsData = [
    {
      name: 'Jaipur Municipal Corporation (Greater & Heritage)',
      code: 'JMC',
      category: 'Urban Sanitation & Civic Infrastructure',
      city: 'Jaipur',
      contactPerson: 'Suresh Chandra, Additional Commissioner',
      email: 'commissioner@jmc.rajasthan.gov.in',
      phone: '+91 141 2741424',
      description: 'Synthetic record: Primary civic authority responsible for city drainage, waste management, parks, and local roads.',
    },
    {
      name: 'Public Works Department (PWD City Circle)',
      code: 'PWD',
      category: 'Roads & Bridges',
      city: 'Jaipur',
      contactPerson: 'Er. Rajesh K. Mathur, Chief Engineer',
      email: 'ce.jaipur@pwd.rajasthan.gov.in',
      phone: '+91 141 2227184',
      description: 'Synthetic record: Responsible for arterial road construction, smart corridors, flyovers, and pavement maintenance.',
    },
    {
      name: 'Public Health Engineering Department (PHED Water Supply)',
      code: 'PHED',
      category: 'Water Supply & Sewerage',
      city: 'Jaipur',
      contactPerson: 'Er. Neeraj Bhargava, Superintending Engineer',
      email: 'se.water@phed.rajasthan.gov.in',
      phone: '+91 141 2223847',
      description: 'Synthetic record: Responsible for potable water transmission pipelines, distribution networks, and pumping stations.',
    },
    {
      name: 'Jaipur Vidyut Vitran Nigam Ltd (JVVNL Power Distribution)',
      code: 'JVVNL',
      category: 'Power & Energy Distribution',
      city: 'Jaipur',
      contactPerson: 'Er. Sandeep Mittal, Superintending Engineer (City)',
      email: 'se.city@jvvnl.org',
      phone: '+91 141 2202681',
      description: 'Synthetic record: Electric utility managing HT/LT power distribution lines, substations, and underground cable networks.',
    },
    {
      name: 'Rajasthan State Gas Limited (RSGL City Gas Distribution)',
      code: 'RSGL',
      category: 'City Gas Utility',
      city: 'Jaipur',
      contactPerson: 'Devendra Shekhawat, General Manager',
      email: 'projects@rsgl.rajasthan.gov.in',
      phone: '+91 141 4082500',
      description: 'Synthetic record: Piped natural gas (PNG) and compressed natural gas (CNG) pipeline distribution network agency.',
    },
  ];

  const deptMap = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    deptMap[d.code] = dept;
  }
  console.log(`Seeded ${Object.keys(deptMap).length} departments.`);

  // 2. Seed Users
  const adminPasswordHash = await bcrypt.hash('Admin@Sutra2026', 10);
  const userPasswordHash = await bcrypt.hash('User@Sutra2026', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@jaipur.sutra.gov.in' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@jaipur.sutra.gov.in',
      passwordHash: adminPasswordHash,
      name: 'Rakesh Sharma, IAS',
      designation: 'Chief Municipal Coordinator',
      role: 'ADMIN',
      departmentId: deptMap['JMC'].id,
    },
  });

  const pwdUser = await prisma.user.upsert({
    where: { email: 'engineer.pwd@jaipur.sutra.gov.in' },
    update: { passwordHash: userPasswordHash },
    create: {
      email: 'engineer.pwd@jaipur.sutra.gov.in',
      passwordHash: userPasswordHash,
      name: 'Vikram Rathore',
      designation: 'Executive Engineer (Roads)',
      role: 'DEPARTMENT_USER',
      departmentId: deptMap['PWD'].id,
    },
  });

  const phedUser = await prisma.user.upsert({
    where: { email: 'engineer.phed@jaipur.sutra.gov.in' },
    update: { passwordHash: userPasswordHash },
    create: {
      email: 'engineer.phed@jaipur.sutra.gov.in',
      passwordHash: userPasswordHash,
      name: 'Sunita Verma',
      designation: 'Assistant Engineer (Distribution)',
      role: 'DEPARTMENT_USER',
      departmentId: deptMap['PHED'].id,
    },
  });

  const gasUser = await prisma.user.upsert({
    where: { email: 'officer.gas@jaipur.sutra.gov.in' },
    update: { passwordHash: userPasswordHash },
    create: {
      email: 'officer.gas@jaipur.sutra.gov.in',
      passwordHash: userPasswordHash,
      name: 'Amit Meena',
      designation: 'Field Operations Lead',
      role: 'DEPARTMENT_USER',
      departmentId: deptMap['RSGL'].id,
    },
  });
  console.log('Seeded initial administrative and departmental users.');

  // 3. Seed Projects (including intentional overlapping conflicts in Jaipur)
  const projectsData = [
    {
      code: 'PWD-2026-001',
      title: 'MI Road Smart Corridor Resurfacing & Walkway Modernization',
      description: 'Synthetic demo record: Complete bituminous asphalt overlay, utility conduit installation, and pedestrian walkway paving from Ajmeri Gate to Government Hostel.',
      owningDepartmentId: deptMap['PWD'].id,
      locationName: 'MI Road, Ajmeri Gate to Paanch Batti, Jaipur',
      latitude: 26.9174,
      longitude: 75.8080,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2027-02-28'),
      responsibleOfficer: 'Er. Vikram Rathore (EE PWD)',
      priority: 'HIGH',
      status: 'PLANNED',
      budget: 420.0,
      progress: 15,
    },
    {
      code: 'PHED-2026-003',
      title: 'MI Road Feeder Water Main Replacement (450mm DI Pipeline)',
      description: 'Synthetic demo record: Trench excavation and replacement of aging cast iron water distribution trunk mains with ductile iron pipes to curb leakage.',
      owningDepartmentId: deptMap['PHED'].id,
      locationName: 'MI Road (Paanch Batti to Bhagwan Das Road Junction)',
      latitude: 26.9180,
      longitude: 75.8092, // ~130 meters away from PWD project!
      startDate: new Date('2026-11-15'),
      endDate: new Date('2027-01-30'), // Direct schedule overlap!
      responsibleOfficer: 'Er. Sunita Verma (AE PHED)',
      priority: 'CRITICAL',
      status: 'PLANNED',
      budget: 185.0,
      progress: 10,
    },
    {
      code: 'RSGL-2026-002',
      title: 'City Gas Distribution Grid Extension — C-Scheme to MI Road',
      description: 'Synthetic demo record: Subsurface directional drilling and installation of 125mm MDPE natural gas pipeline network.',
      owningDepartmentId: deptMap['RSGL'].id,
      locationName: 'Bhagwan Das Road & MI Road Crossing',
      latitude: 26.9165,
      longitude: 75.8068, // ~160 meters away from PWD project!
      startDate: new Date('2026-12-01'),
      endDate: new Date('2027-03-15'), // Overlaps with PWD!
      responsibleOfficer: 'Amit Meena (RSGL Field Lead)',
      priority: 'HIGH',
      status: 'PROPOSED',
      budget: 95.0,
      progress: 0,
    },
    {
      code: 'JMC-2026-012',
      title: 'Johari Bazaar Heritage Stormwater Drainage Upgradation',
      description: 'Synthetic demo record: Precast RCC box drain installation to avert monsoon waterlogging in Walled City corridor.',
      owningDepartmentId: deptMap['JMC'].id,
      locationName: 'Johari Bazaar to Sanganeri Gate, Old City Jaipur',
      latitude: 26.9205,
      longitude: 75.8272,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2027-01-20'),
      responsibleOfficer: 'P. K. Verma (Executive Engineer JMC)',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      budget: 310.0,
      progress: 40,
    },
    {
      code: 'JVVNL-2026-007',
      title: 'Underground Power Cabling & Ring Main Unit Conversion — C-Scheme',
      description: 'Synthetic demo record: Transitioning overhead 11kV lines to underground duct conduits with modern compact ring main units.',
      owningDepartmentId: deptMap['JVVNL'].id,
      locationName: 'Subhash Marg & Ahinsa Circle, C-Scheme, Jaipur',
      latitude: 26.9118,
      longitude: 75.7995,
      startDate: new Date('2026-11-10'),
      endDate: new Date('2027-04-30'),
      responsibleOfficer: 'Er. Alok Saxena (XEN JVVNL)',
      priority: 'HIGH',
      status: 'PLANNED',
      budget: 540.0,
      progress: 20,
    },
    {
      code: 'JMC-2026-018',
      title: 'Mansarovar Sector 3 Smart Green Space & Recharge Pit',
      description: 'Synthetic demo record: Community park rejuvenation, permeable paving, and deep rainwater harvesting percolation shaft.',
      owningDepartmentId: deptMap['JMC'].id,
      locationName: 'Sector 3 Park, Mansarovar, Jaipur',
      latitude: 26.8525,
      longitude: 75.7682,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      responsibleOfficer: 'K. S. Shekhawat (Horticulture Officer JMC)',
      priority: 'LOW',
      status: 'IN_PROGRESS',
      budget: 65.0,
      progress: 60,
    },
  ];

  const projectMap = {};
  for (const p of projectsData) {
    const proj = await prisma.project.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
    projectMap[p.code] = proj;
  }
  console.log(`Seeded ${Object.keys(projectMap).length} projects.`);

  // 4. Seed Project Participations (Interdepartmental cooperation)
  const participations = [
    { projectId: projectMap['PWD-2026-001'].id, departmentId: deptMap['PHED'].id, role: 'Water Utility Relocation' },
    { projectId: projectMap['PWD-2026-001'].id, departmentId: deptMap['JVVNL'].id, role: 'Street Light & Cable Ducting' },
    { projectId: projectMap['JMC-2026-012'].id, departmentId: deptMap['PWD'].id, role: 'Pavement Restoration Coordination' },
    { projectId: projectMap['JVVNL-2026-007'].id, departmentId: deptMap['PWD'].id, role: 'Right-of-Way Trenching Clearance' },
  ];

  for (const part of participations) {
    await prisma.projectDepartment.upsert({
      where: {
        projectId_departmentId: {
          projectId: part.projectId,
          departmentId: part.departmentId,
        },
      },
      update: { role: part.role },
      create: part,
    });
  }
  console.log('Seeded interdepartmental project participations.');

  // 5. Evaluate and seed Project Conflicts automatically
  const allProjects = await prisma.project.findMany({
    include: { owningDepartment: true },
  });

  let conflictCount = 0;
  for (let i = 0; i < allProjects.length; i++) {
    for (let j = i + 1; j < allProjects.length; j++) {
      const conflictData = evaluateProjectConflict(allProjects[i], allProjects[j]);
      if (conflictData) {
        await prisma.projectConflict.upsert({
          where: {
            projectAId_projectBId: {
              projectAId: conflictData.projectAId,
              projectBId: conflictData.projectBId,
            },
          },
          update: {
            distanceMeters: conflictData.distanceMeters,
            scheduleOverlapDays: conflictData.scheduleOverlapDays,
            suggestedAction: conflictData.suggestedAction,
          },
          create: {
            projectAId: conflictData.projectAId,
            projectBId: conflictData.projectBId,
            distanceMeters: conflictData.distanceMeters,
            scheduleOverlapDays: conflictData.scheduleOverlapDays,
            suggestedAction: conflictData.suggestedAction,
            status: 'DETECTED',
          },
        });
        conflictCount++;
      }
    }
  }
  console.log(`Evaluated and recorded ${conflictCount} geospatial and schedule project conflicts.`);

  // 6. Seed Shared Resources
  const resourcesData = [
    {
      name: 'CAT 320D Heavy Crawler Excavator (0.92 m³ Bucket)',
      category: 'Excavation & Earthmoving',
      owningDepartmentId: deptMap['PWD'].id,
      location: 'PWD Central Mechanical Division, 22 Godam, Jaipur',
      quantity: 2,
      status: 'AVAILABLE',
      description: 'Heavy hydraulic crawler excavator suitable for deep road cut, foundation trenching, and rock removal.',
    },
    {
      name: 'JCB 3DX Plus EcoXcellence Backhoe Loader',
      category: 'Excavation & Loading',
      owningDepartmentId: deptMap['JMC'].id,
      location: 'JMC Garage, Transport Nagar, Jaipur',
      quantity: 4,
      status: 'AVAILABLE',
      description: 'Versatile rubber-tired loader-excavator ideal for urban trenching and debris loading.',
    },
    {
      name: 'Hamm HD 90 Dual-Drum Vibratory Tandem Roller 9-Ton',
      category: 'Compaction Equipment',
      owningDepartmentId: deptMap['PWD'].id,
      location: 'PWD Asphalt Plant Yard, Jhalana Doongri, Jaipur',
      quantity: 2,
      status: 'AVAILABLE',
      description: 'High-compaction tandem roller engineered for smooth asphalt and DBM layer finishing.',
    },
    {
      name: 'Radiodetection RD8200 Precision Pipe & Cable Locator',
      category: 'Utility Inspection & Detection',
      owningDepartmentId: deptMap['PHED'].id,
      location: 'PHED Central Instrumentation Lab, Hasanpura, Jaipur',
      quantity: 3,
      status: 'AVAILABLE',
      description: 'Ground-penetrating precision electromagnetic locator for tracing underground metallic and energized conduits.',
    },
    {
      name: 'IBAK Mainline CCTV Sewer & Pipe Inspection Crawler Robot',
      category: 'Utility Inspection & Detection',
      owningDepartmentId: deptMap['PHED'].id,
      location: 'PHED Drainage Division, Gandhinagar, Jaipur',
      quantity: 1,
      status: 'AVAILABLE',
      description: 'Motorized pan-and-tilt CCTV robotic crawler for pipeline defect diagnosis from 150mm to 1200mm dia.',
    },
    {
      name: '125 kVA Ashok Leyland Mobile Silent Generator Van',
      category: 'Emergency Power & Generators',
      owningDepartmentId: deptMap['JVVNL'].id,
      location: 'JVVNL Circle Substation, Bani Park, Jaipur',
      quantity: 2,
      status: 'AVAILABLE',
      description: 'Truck-mounted silent diesel generator unit for temporary uninterrupted power supply during planned maintenance.',
    },
    {
      name: 'Leica TS16 Robotic Total Station & RTK DGPS Survey Unit',
      category: 'Surveying & Geospatial',
      owningDepartmentId: deptMap['JMC'].id,
      location: 'JMC GIS Mapping Cell, Lal Kothi, Jaipur',
      quantity: 2,
      status: 'AVAILABLE',
      description: 'Sub-centimeter accuracy geospatial surveying kit for alignment demarcations and corridor right-of-way mapping.',
    },
  ];

  for (const r of resourcesData) {
    const existing = await prisma.resource.findFirst({
      where: { name: r.name, owningDepartmentId: r.owningDepartmentId },
    });
    if (!existing) {
      await prisma.resource.create({ data: r });
    }
  }
  console.log('Seeded shared resource inventory.');

  // 7. Seed Discussions
  const disc1 = await prisma.discussion.create({
    data: {
      title: 'Coordination Protocol: MI Road PWD Paving vs PHED Water Trunk Line',
      message: 'Notice to PHED and PWD project leads: Both the Smart Corridor Resurfacing (PWD-2026-001) and Water Trunk Line Replacement (PHED-2026-003) have scheduled ground excavation between November 2026 and January 2027 along MI Road.\n\nTo prevent newly surfaced asphalt from being cut, PHED must complete pipeline lowering by December 20, 2026, followed by joint compaction testing.',
      projectId: projectMap['PWD-2026-001'].id,
      departmentId: deptMap['JMC'].id,
      authorId: admin.id,
      replies: {
        create: [
          {
            message: 'Acknowledged. We have prioritized the 450mm DI pipe trenching from Paanch Batti to start November 15. We request PWD to hold final asphalt laying on the north carriageway until December 25.',
            departmentId: deptMap['PHED'].id,
            authorId: phedUser.id,
          },
          {
            message: 'Agreed. PWD will phase works: south carriageway and pedestrian walkways first, allowing PHED unobstructed corridor access on the north side.',
            departmentId: deptMap['PWD'].id,
            authorId: pwdUser.id,
          },
        ],
      },
    },
  });

  const disc2 = await prisma.discussion.create({
    data: {
      title: 'City Gas Distribution Safety Clearances along Bhagwan Das Crossing',
      message: 'RSGL plans to pull 125mm MDPE gas piping using horizontal directional drilling (HDD). Please verify depths of existing JVVNL high-tension cables and PHED valves at the intersection.',
      projectId: projectMap['RSGL-2026-002'].id,
      departmentId: deptMap['RSGL'].id,
      authorId: gasUser.id,
      replies: {
        create: [
          {
            message: 'JVVNL 11kV feeder runs along the eastern footpath at 1.4m depth. We can provide our cable route plan and deploy our RD8200 locator for joint marking next Tuesday.',
            departmentId: deptMap['JVVNL'].id,
            authorId: admin.id,
          },
        ],
      },
    },
  });

  console.log('Seeded sample interdepartmental discussions and replies.');
  console.log('\nSeed completed successfully! Jaipur municipal demo database is fully initialized.\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

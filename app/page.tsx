'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, CheckCheck, Circle, Flag, LayoutGrid, List, Search, Users, Workflow } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CompactThemeSelector } from '@/components/theme/CompactThemeSelector';
import styles from './landing.module.css';

const tasks = [
  { title: 'รวบรวมไอเดียแคมเปญ', category: 'วางแผน', owner: 'พ', date: '12 ก.ย.', status: 0 },
  { title: 'ออกแบบภาพหลัก', category: 'ออกแบบ', owner: 'ม', date: '14 ก.ย.', status: 1 },
  { title: 'เตรียมเนื้อหาวันเปิดตัว', category: 'คอนเทนต์', owner: 'ต', date: '15 ก.ย.', status: 1 },
  { title: 'สรุปเป้าหมายของทีม', category: 'วางแผน', owner: 'พ', date: '11 ก.ย.', status: 2 },
];
const views = [{ name: 'บอร์ด', icon: LayoutGrid }, { name: 'รายการ', icon: List }, { name: 'ปฏิทิน', icon: CalendarDays }];
const statuses = ['ยังไม่เริ่ม', 'กำลังทำ', 'เสร็จแล้ว'];

function PlannerPreview() {
  const [view, setView] = useState(0);
  return (
    <figure className={styles.preview} id="preview" aria-label="ตัวอย่างการจัดแผนงานใน Planner">
      <div className={styles.windowBar}><span aria-hidden="true" className={styles.windowDots}><i /><i /><i /></span><span>Planner · พื้นที่ของทีม</span><span className={styles.example}>ข้อมูลตัวอย่าง</span></div>
      <div className={styles.appFrame}>
        <aside className={styles.sidebar} aria-label="ตัวอย่างเมนู">
          <div className={styles.mockSearch}><Search size={14} /> ค้นหางาน</div>
          <p><LayoutGrid size={16} /> ภาพรวม</p><p><CheckCheck size={16} /> งานของฉัน <small>4</small></p>
          <span className={styles.sidebarLabel}>พื้นที่ทำงาน</span><p className={styles.selected}><Users size={16} /> ทีมสร้างสรรค์</p>
          <span className={styles.sidebarLabel}>แผนงานของทีม</span><p className={styles.planSelected}><span className={styles.blueDot} /> เปิดตัวแคมเปญ</p><p><span className={styles.grayDot} /> ไอเดียเดือนหน้า</p>
          <div className={styles.sidebarBottom}><span className={styles.avatar}>พ</span><span>พื้นที่ของเรา<small>ทำสิ่งดี ๆ ไปด้วยกัน</small></span></div>
        </aside>
        <div className={styles.workspace}>
          <div className={styles.breadcrumb}>ทีมสร้างสรรค์ <span>/</span> แผนงาน</div>
          <div className={styles.workspaceTitle}><div><h3>เปิดตัวแคมเปญ</h3><p>จากไอเดียแรก สู่วันเปิดตัวที่ทุกคนพร้อม</p></div><div className={styles.avatars} aria-label="สมาชิกตัวอย่าง 3 คน"><span>พ</span><span>ม</span><span>ต</span></div></div>
          <div className={styles.toolbar}><div className={styles.viewPicker} role="group" aria-label="เลือกมุมมองตัวอย่าง">{views.map(({ name, icon: Icon }, index) => <button key={name} type="button" aria-pressed={view === index} onClick={() => setView(index)}><Icon size={14} />{name}</button>)}</div><span className={styles.taskCount}>4 งาน · 1 งานเสร็จแล้ว</span></div>
          <div className={styles.demoContent} aria-live="polite">
            {view === 0 && <div className={styles.board}>{statuses.map((status, index) => <div className={styles.column} key={status}><h4><span className={styles.statusDot} data-status={index} />{status}<small>{tasks.filter(task => task.status === index).length}</small></h4>{tasks.filter(task => task.status === index).map(task => <div className={styles.taskCard} key={task.title}><span className={styles.tag}>{task.category}</span><h5>{task.status === 2 && <Check size={14} />}{task.title}</h5><div className={styles.taskMeta}><span><CalendarDays size={12} />{task.date}</span><span className={styles.avatar}>{task.owner}</span></div></div>)}</div>)}</div>}
            {view === 1 && <div className={styles.taskList}>{tasks.map(task => <div className={styles.listRow} key={task.title}>{task.status === 2 ? <Check size={18} color="var(--color-alert-success-icon)" /> : <Circle size={18} color="var(--color-content-tertiary)" />}<strong>{task.title}</strong><span>{statuses[task.status]}</span><small>{task.date}</small></div>)}</div>}
            {view === 2 && <div className={styles.calendar}><h4>กันยายน · สัปดาห์เปิดตัว</h4><div className={styles.calendarGrid}>{[11, 12, 13, 14, 15].map(day => <div key={day}><span>{day}</span>{tasks.filter(task => task.date.startsWith(String(day))).map(task => <p key={task.title}>{task.title}</p>)}</div>)}</div></div>}
          </div>
          <div className={styles.previewFoot}><span><Check size={13} /> ทุกก้าวเล็ก ๆ พาแผนไปข้างหน้า</span><span>ความคืบหน้า 25%</span></div>
        </div>
      </div>
      <figcaption>ภาพจำลองแนวคิดการใช้งาน · ลองสลับมุมมองด้านบนได้</figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const { user, loading } = useCurrentUser();
  const startHref = user ? '/home' : '/register';
  const startLabel = user ? 'ไปที่ Planner ของคุณ' : 'เริ่มต้นใช้งาน';
  return (
    <div className={styles.landing}>
      <a className={styles.skipLink} href="#introduction">ข้ามไปเนื้อหา</a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="เมนูหลัก">
          <Link href="/" className={styles.logo}><span><CheckCheck size={21} /></span>Planner</Link>
          <div className={styles.navLinks}><a href="#features">ทำอะไรได้บ้าง</a><a href="#preview">ดูตัวอย่าง</a></div>
          <div className={styles.navControls}>
            <CompactThemeSelector />
            <Link className={styles.navAction} href={user ? '/home' : '/login'}>
              {loading ? 'เริ่มต้น' : user ? 'เปิด Planner' : 'เข้าสู่ระบบ'}<ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>
      <section className={styles.hero} id="introduction">
        <div className={styles.eyebrow}><span className={styles.blueDot} /> พื้นที่สำหรับทุกแผนของคุณ</div>
        <h1>จัดงานให้ชัดเจน<br /><span>มีพื้นที่ให้ไอเดียไปต่อ</span></h1>
        <p className={styles.heroDescription}>รวมแผน งาน และทีมไว้ในที่เดียว<br /> ให้ทุกคนเห็นภาพเดียวกัน และรู้ว่าสิ่งต่อไปคืออะไร</p>
        <div className={styles.actions}><Link className={styles.primary} href={startHref}>{startLabel}<ArrowRight size={18} /></Link><a className={styles.secondary} href="#preview">รู้จัก Planner <span aria-hidden="true">↗</span></a></div>
        <p className={styles.heroNote}>จากเรื่องเล็กในแต่ละวัน ถึงแผนใหญ่ที่ทำด้วยกัน</p>
      </section>
      <div className={styles.previewWrap}><PlannerPreview /></div>
      <section className={styles.features} id="features" aria-labelledby="features-title"><div className={styles.sectionIntro}><span className={styles.eyebrow}>ชัดขึ้น เบาขึ้น ไปต่อได้ง่ายขึ้น</span><h2 id="features-title">งานหลายอย่าง<br />จัดให้ลงตัวได้ในที่เดียว</h2><p>ลดเวลาตามหาว่าอะไรอยู่ที่ไหน<br />แล้วกลับมาโฟกัสกับงานที่อยากทำให้ดี</p></div><div className={styles.featureGrid}>{[
        { icon: LayoutGrid, title: 'เห็นภาพรวม ไม่หลงรายละเอียด', text: 'แบ่งงานเป็นขั้นตอน ติดตามสถานะบนบอร์ด และเห็นได้ทันทีว่างานไหนกำลังเดินหน้า', label: 'ทุกงานมีที่ของมัน' },
        { icon: CalendarDays, title: 'วางแผนในมุมที่คุณถนัด', text: 'มองงานเป็นรายการ ปฏิทิน หรือไทม์ไลน์ เพื่อจัดลำดับสิ่งสำคัญและกำหนดส่งให้ชัดเจน', label: 'หลายมุมมอง แผนเดียวกัน' },
        { icon: Users, title: 'เดินหน้าไปพร้อมกับทีม', text: 'รวมคนและแผนงานเป็นกลุ่ม ระบุผู้รับผิดชอบ ให้ทุกคนรู้บทบาทของตัวเอง', label: 'รู้ว่าใครกำลังทำอะไร' },
      ].map(({ icon: Icon, title, text, label }) => <article className={styles.featureCard} key={title}><div className={styles.featureIcon}><Icon size={25} /></div><span className={styles.featureLabel}>{label}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className={styles.journey} aria-labelledby="journey-title"><div><span className={styles.eyebrow}>เริ่มจากหนึ่งแผน</span><h2 id="journey-title">เปลี่ยนสิ่งที่คิด<br />ให้เป็นสิ่งที่ทำสำเร็จ</h2></div><ol>{[{ icon: Flag, title: 'สร้างพื้นที่ให้แผนของคุณ', text: 'เริ่มแผนงานใหม่ สำหรับตัวเองหรือทีม' }, { icon: List, title: 'แตกไอเดียให้เป็นงานที่ชัดเจน', text: 'เพิ่มงาน กำหนดวัน และผู้รับผิดชอบ' }, { icon: Workflow, title: 'ค่อย ๆ เดินหน้า เห็นความคืบหน้า', text: 'อัปเดตสถานะ แล้วไปต่อทีละขั้น' }].map(({ icon: Icon, title, text }, i) => <li key={title}><span className={styles.stepIcon}><Icon size={21} /></span><div><small>0{i + 1}</small><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
      <section className={styles.closing}><span className={styles.closingIcon}><CheckCheck size={32} /></span><h2>แผนต่อไปของคุณ<br />เริ่มได้ตรงนี้</h2><p>ให้ Planner ช่วยจัดระเบียบงาน<br />แล้วคุณไปทำสิ่งที่สำคัญ</p><Link className={styles.primary} href={startHref}>{startLabel}<ArrowRight size={18} /></Link></section>
      <footer className={styles.footer}><span className={styles.footerBrand}>Planner <small>พื้นที่ให้ทุกแผนไปต่อ</small></span><div><Link href="/privacy-policy">ความเป็นส่วนตัว</Link><Link href="/terms-of-service">เงื่อนไขการใช้งาน</Link></div></footer>
    </div>
  );
}

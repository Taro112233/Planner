// app/terms-of-service/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Scale,
  AlertTriangle,
  Info,
  Shield,
  FileText,
  Users,
  Ban,
  CheckCircle,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />

      <main className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {/* Header */}
            <motion.div variants={fadeIn} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-interactive-primary/10 rounded-full mb-4">
                <Scale className="w-8 h-8 text-interactive-primary" />
              </div>
              <h1 className="text-4xl font-bold text-content-primary mb-4">
                ข้อกำหนดและเงื่อนไขการใช้บริการ
              </h1>
              <p className="text-lg text-content-secondary">
                Terms and Conditions of Service
              </p>
              <p className="text-sm text-content-tertiary mt-2">
                มีผลบังคับใช้: 26 มกราคม 2568
              </p>
            </motion.div>

            {/* Critical Warning */}
            <motion.div variants={fadeIn}>
              <Alert className="border-alert-error-border bg-alert-error-bg mb-8">
                <AlertTriangle className="h-5 w-5 text-alert-error-icon" />
                <AlertDescription className="text-alert-error-text">
                  <strong className="font-semibold text-lg">⚠️ ข้อกำหนดสำคัญ - กรุณาอ่านให้ละเอียด</strong>
                  <ul className="list-disc list-inside mt-3 space-y-1">
                    <li><strong>บริการนี้เป็น Sandbox/Prototype Environment</strong> ไม่ใช่ระบบสำหรับใช้งานจริงในการรักษาผู้ป่วย</li>
                    <li><strong>ผู้ให้บริการไม่รับผิดชอบ</strong>ต่อความเสียหายใดๆ ที่เกิดจากการใช้เครื่องมือ</li>
                    <li><strong>ห้ามเด็ดขาด:</strong> การใช้ข้อมูลผู้ป่วยจริง (Real Patient Data)</li>
                    <li>การใช้บริการนี้ถือว่าคุณยอมรับข้อกำหนดทั้งหมดโดยไม่มีเงื่อนไข</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Section 1: Introduction */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-interactive-primary" />
                    1. บทนำ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-content-secondary">
                    ข้อกำหนดและเงื่อนไขการใช้บริการ (&quot;ข้อตกลง&quot;) นี้เป็นสัญญาทางกฎหมายระหว่าง
                    คุณ (&quot;ผู้ใช้&quot;, &quot;คุณ&quot;) และ NextJS Starter (&quot;เรา&quot;, &quot;ผู้ให้บริการ&quot;)
                  </p>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">1.1 ข้อมูลผู้ให้บริการ</h3>
                    <div className="bg-surface-secondary rounded-lg p-4 space-y-1 text-sm">
                      <p><strong>ชื่อบริการ:</strong> NextJS Starter</p>
                      <p><strong>ประเภท:</strong> บุคคลธรรมดา (Individual)</p>
                      <p><strong>ที่อยู่:</strong> Phitsanulok, Thailand 65000</p>
                      <p><strong>อีเมล:</strong> thanatouchth@gmail.com</p>
                      <p><strong>โทรศัพท์:</strong> 095-590-4245</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">1.2 การยอมรับข้อตกลง</h3>
                    <p className="text-content-secondary">
                      การเข้าใช้หรือลงทะเบียนบริการนี้ ถือว่าคุณ:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary mt-2">
                      <li>ได้อ่านและเข้าใจข้อตกลงนี้แล้ว</li>
                      <li>ยอมรับที่จะผูกพันตามข้อตกลงนี้</li>
                      <li>มีอายุอย่างน้อย 18 ปีบริบูรณ์</li>
                      <li>มีสิทธิตามกฎหมายในการทำสัญญานี้</li>
                    </ul>
                  </div>

                  <Alert className="bg-alert-warning-bg border-alert-warning-border">
                    <AlertTriangle className="h-4 w-4 text-alert-warning-icon" />
                    <AlertDescription className="text-alert-warning-text">
                      <strong>หมายเหตุ:</strong> หากคุณไม่ยอมรับข้อตกลงนี้ กรุณาหยุดการใช้บริการทันที
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 2: Service Description */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-interactive-primary" />
                    2. ลักษณะของบริการ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">2.1 บริการที่ให้:</h3>
                    <p className="text-content-secondary mb-2">
                      NextJS Starter เป็นแพลตฟอร์ม Sandbox สำหรับ:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary">
                      <li>รับและพิจารณาคำขอพัฒนาเครื่องมือดิจิทัลทางการแพทย์</li>
                      <li>พัฒนา Prototype/MVP ของเครื่องมือสุขภาพ</li>
                      <li>เป็นพื้นที่ทดลองและเรียนรู้เทคโนโลยี</li>
                      <li>แบ่งปันความรู้และประสบการณ์</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">2.2 ข้อจำกัดของบริการ:</h3>
                    <Alert className="border-alert-error-border bg-alert-error-bg">
                      <Ban className="h-4 w-4 text-alert-error-icon" />
                      <AlertDescription className="text-alert-error-text">
                        <strong>บริการนี้ไม่ใช่:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>ระบบสารสนเทศทางการแพทย์ที่ได้รับรอง (Certified Medical Software)</li>
                          <li>บริการให้คำปรึกษาทางการแพทย์</li>
                          <li>เครื่องมือแพทย์ที่ผ่านการรับรองจาก FDA หรือ อย.</li>
                          <li>ระบบที่รับประกันความถูกต้อง 100%</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">2.3 การไม่รับประกัน:</h3>
                    <p className="text-content-secondary">
                      เราให้บริการตาม <strong>&quot;AS-IS&quot;</strong> และ <strong>&quot;AS-AVAILABLE&quot;</strong> basis
                      โดยไม่มีการรับประกันใดๆ ทั้งโดยชัดแจ้งหรือโดยนัยยะ รวมถึง:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary mt-2">
                      <li>ความถูกต้อง ครบถ้วน หรือเชื่อถือได้ของเครื่องมือ</li>
                      <li>ความเหมาะสมต่อวัตถุประสงค์เฉพาะ</li>
                      <li>การทำงานไม่หยุดชะงักหรือปราศจากข้อผิดพลาด</li>
                      <li>ความปลอดภัยของข้อมูล 100%</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 3: User Obligations */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-interactive-primary" />
                    3. หน้าที่และความรับผิดชอบของผู้ใช้
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">3.1 การลงทะเบียนและบัญชีผู้ใช้:</h3>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary">
                      <li>คุณต้องให้ข้อมูลที่ถูกต้องและเป็นจริง</li>
                      <li>คุณรับผิดชอบในการรักษาความปลอดภัยของรหัสผ่าน</li>
                      <li>ห้ามแชร์บัญชีหรือให้ผู้อื่นใช้บัญชีของคุณ</li>
                      <li>แจ้งเราทันทีหากพบการเข้าใช้งานที่ไม่ได้รับอนุญาต</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">3.2 การใช้งานที่ยอมรับได้:</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-alert-success-text mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          ✅ สามารถทำได้:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-content-secondary text-sm ml-6">
                          <li>ส่งคำขอพัฒนาเครื่องมือ</li>
                          <li>ให้ข้อมูลและความร่วมมือในการพัฒนา</li>
                          <li>ทดสอบและให้ Feedback</li>
                          <li>ใช้เครื่องมือเพื่อการศึกษาและทดลอง</li>
                          <li>แชร์เครื่องมือให้เพื่อนร่วมงาน (ภายใต้ข้อจำกัด)</li>
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-alert-error-text mb-2 flex items-center gap-2">
                          <Ban className="w-4 h-4" />
                          ❌ ห้ามเด็ดขาด:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-content-secondary text-sm ml-6">
                          <li>ใช้ข้อมูลผู้ป่วยจริง (Real Patient Data)</li>
                          <li>นำเครื่องมือไปใช้ในการตัดสินใจรักษาผู้ป่วยโดยตรง (โดยไม่ผ่าน Validation)</li>
                          <li>ขายหรือนำเครื่องมือไปหาประโยชน์เชิงพาณิชย์โดยไม่ได้รับอนุญาต</li>
                          <li>Reverse engineer, decompile หรือ hack ระบบ</li>
                          <li>ส่งคำขอที่ผิดกฎหมายหรือขัดต่อจริยธรรม</li>
                          <li>แวบอ้างว่าเป็นบุคคลอื่นหรือให้ข้อมูลเท็จ</li>
                          <li>ละเมิดสิทธิ์ทางปัญญาของผู้อื่น</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">3.3 ความรับผิดชอบในการใช้เครื่องมือ:</h3>
                    <Alert className="border-alert-warning-border bg-alert-warning-bg">
                      <AlertTriangle className="h-4 w-4 text-alert-warning-icon" />
                      <AlertDescription className="text-alert-warning-text">
                        <strong>สำคัญมาก:</strong> หากคุณเลือกที่จะนำเครื่องมือไปใช้กับผู้ป่วยจริง:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>คุณ<strong>รับผิดชอบแต่เพียงผู้เดียว</strong>ในการ Validate ความถูกต้อง</li>
                          <li>คุณต้อง<strong>ทดสอบอย่างละเอียด</strong>และมี<strong>แพทย์ตรวจสอบ</strong></li>
                          <li>คุณ<strong>รับผิดชอบ</strong>ต่อความเสียหายทั้งหมดที่อาจเกิดขึ้น</li>
                          <li>ผู้ให้บริการ<strong>ไม่รับผิดชอบใดๆ</strong> ทั้งสิ้น</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 4: Intellectual Property */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-interactive-primary" />
                    4. ลิขสิทธิ์และทรัพย์สินทางปัญญา
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">4.1 ความเป็นเจ้าของ:</h3>
                    <ul className="list-disc list-inside space-y-2 text-content-secondary">
                      <li>
                        <strong className="text-content-primary">Idea/Concept ของคำขอ:</strong> เป็นของผู้ส่งคำขอ
                      </li>
                      <li>
                        <strong className="text-content-primary">Source Code และเครื่องมือ:</strong> เป็นของ NextJS Starter
                      </li>
                      <li>
                        <strong className="text-content-primary">สิทธิ์การใช้งาน:</strong> Dual License
                        <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                          <li>ผู้ส่งคำขอ: ใช้งานได้ฟรีตลอดไป (ภายใต้ข้อจำกัด)</li>
                          <li>ผู้พัฒนา: เป็นเจ้าของโค้ดและสามารถใช้ต่อได้</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">4.2 การใช้เชิงพาณิชย์:</h3>
                    <p className="text-content-secondary mb-2">
                      หากต้องการนำเครื่องมือไปใช้เชิงพาณิชย์:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary">
                      <li>ต้อง<strong className="text-content-primary">ขออนุญาตเป็นลายลักษณ์อักษร</strong>ล่วงหน้า</li>
                      <li>อาจมี<strong className="text-content-primary">ค่าธรรมเนียม License Fee</strong> (ตามตกลง)</li>
                      <li>ต้องลงนามใน<strong className="text-content-primary">Commercial License Agreement</strong></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">4.3 Open Source:</h3>
                    <p className="text-content-secondary">
                      เครื่องมือบางประเภทอาจถูกเผยแพร่เป็น Open Source (MIT หรือ Apache 2.0)
                      ตามดุลยพินิจของผู้ให้บริการ โดยคำนึงถึง:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary mt-2">
                      <li>ความซับซ้อนของเครื่องมือ</li>
                      <li>ประโยชน์ต่อสาธารณะ</li>
                      <li>ความเห็นของผู้ส่งคำขอ</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">4.4 เครื่องหมายการค้า:</h3>
                    <p className="text-content-secondary">
                      &quot;NextJS Starter&quot; และโลโก้ เป็นทรัพย์สินของผู้ให้บริการ
                      คุณไม่สามารถใช้โดยไม่ได้รับอนุญาต
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 5: Liability Limitation */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8 border-alert-error-border">
                <CardHeader className="bg-alert-error-bg">
                  <CardTitle className="flex items-center gap-2 text-alert-error-text">
                    <AlertTriangle className="w-5 h-5" />
                    5. ข้อจำกัดความรับผิด
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-6 space-y-4">
                  <Alert className="border-alert-error-border bg-alert-error-bg">
                    <Ban className="h-4 w-4 text-alert-error-icon" />
                    <AlertDescription className="text-alert-error-text">
                      <strong className="text-lg">⚠️ ผู้ให้บริการไม่รับผิดชอบต่อความเสียหายใดๆ</strong>
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">5.1 ขอบเขตการไม่รับผิด:</h3>
                    <p className="text-content-secondary mb-2">
                      NextJS Starter และผู้พัฒนา<strong>ไม่รับผิดชอบ</strong>ต่อความเสียหายดังต่อไปนี้
                      ไม่ว่าจะเกิดจาก:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-content-secondary">
                      <li>
                        <strong className="text-content-primary">ความเสียหายต่อผู้ป่วย:</strong>
                        การบาดเจ็บ เจ็บป่วย หรือเสียชีวิต ที่เกิดจากการใช้เครื่องมือ
                      </li>
                      <li>
                        <strong className="text-content-primary">ความเสียหายทางการเงิน:</strong>
                        รายได้สูญเสีย ค่าเสียหายทางกฎหมาย ค่าชดเชย
                      </li>
                      <li>
                        <strong className="text-content-primary">ข้อมูลสูญหาย:</strong>
                        การสูญหาย เสียหาย หรือรั่วไหลของข้อมูล
                      </li>
                      <li>
                        <strong className="text-content-primary">การหยุดชะงักของบริการ:</strong>
                        Downtime, การไม่สามารถเข้าใช้งานได้
                      </li>
                      <li>
                        <strong className="text-content-primary">ข้อผิดพลาดของเครื่องมือ:</strong>
                        Bug, Calculation Error, Logic Error
                      </li>
                      <li>
                        <strong className="text-content-primary">การกระทำของผู้ใช้รายอื่น:</strong>
                        ความเสียหายจากผู้ใช้คนอื่นๆ
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">5.2 วงเงินความรับผิดสูงสุด:</h3>
                    <p className="text-content-secondary">
                      ในกรณีที่มีศาลหรือหน่วยงานที่เกี่ยวข้องตัดสินว่าเราต้องรับผิดชอบ
                      ความรับผิดสูงสุดของเราจำกัดไว้ที่ <strong className="text-content-primary">0 บาท (ศูนย์บาท)</strong>
                      เนื่องจากบริการนี้ให้ฟรีและไม่มีค่าใช้จ่าย
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">5.3 ข้อยกเว้น:</h3>
                    <p className="text-content-secondary">
                      ข้อจำกัดความรับผิดนี้ไม่ใช้กับ:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary mt-2">
                      <li>ความเสียหายที่เกิดจากการกระทำโดยเจตนาหรือประมาทเลินเล่ออย่างร้ายแรง</li>
                      <li>การละเมิดสิทธิส่วนบุคคลตามกฎหมาย PDPA</li>
                      <li>กรณีที่กฎหมายห้ามจำกัดความรับผิด</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 6: Privacy & Data */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-interactive-primary" />
                    6. ความเป็นส่วนตัวและข้อมูล
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-content-secondary">
                    การใช้บริการของคุณอยู่ภายใต้{' '}
                    <a
                      href="/privacy-policy"
                      className="text-interactive-primary hover:opacity-80 font-semibold underline"
                    >
                      นโยบายความเป็นส่วนตัว (Privacy Policy)
                    </a>{' '}
                    ของเรา
                  </p>

                  <Alert className="bg-alert-info-bg border-alert-info-border">
                    <Info className="h-4 w-4 text-alert-info-icon" />
                    <AlertDescription className="text-alert-info-text">
                      <strong>หมายเหตุ:</strong> กรุณาอ่านนโยบายความเป็นส่วนตัวเพิ่มเติม
                      เพื่อทำความเข้าใจว่าเราเก็บรวบรวม ใช้ และคุ้มครองข้อมูลของคุณอย่างไร
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">ข้อห้ามสำคัญ:</h3>
                    <Alert className="border-alert-error-border bg-alert-error-bg">
                      <Ban className="h-4 w-4 text-alert-error-icon" />
                      <AlertDescription className="text-alert-error-text">
                        <strong>ห้ามเด็ดขาด:</strong> อัปโหลดหรือส่งข้อมูลผู้ป่วยจริง (Real Patient Data) รวมถึง:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>ชื่อ-นามสกุล, HN, เลขบัตรประชาชน</li>
                          <li>ผลตรวจแลป, รูปภาพ X-ray/CT/MRI</li>
                          <li>ประวัติการรักษา, ข้อมูลสุขภาพ</li>
                          <li>ข้อมูลอื่นที่สามารถระบุตัวบุคคลได้</li>
                        </ul>
                        <p className="mt-2"><strong>ผลกระทบ:</strong> บัญชีจะถูกระงับทันที และอาจมีความผิดตาม PDPA</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 7: Termination */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>7. การสิ้นสุดการใช้บริการ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">7.1 การยกเลิกโดยผู้ใช้:</h3>
                    <p className="text-content-secondary">
                      คุณสามารถยกเลิกบัญชีได้ตลอดเวลา โดยติดต่อเราทางอีเมล
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">7.2 การระงับโดยผู้ให้บริการ:</h3>
                    <p className="text-content-secondary mb-2">
                      เราสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของคุณทันที หาก:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary">
                      <li>ละเมิดข้อตกลงนี้</li>
                      <li>ใช้ข้อมูลผู้ป่วยจริง</li>
                      <li>กระทำการผิดกฎหมายหรือขัดต่อจริยธรรม</li>
                      <li>ละเมิดสิทธิ์ของผู้อื่น</li>
                      <li>ทำให้ระบบเสียหาย</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">7.3 ผลกระทบจากการยกเลิก:</h3>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary">
                      <li>คุณจะไม่สามารถเข้าถึงบัญชีและข้อมูลได้</li>
                      <li>เครื่องมือที่ได้รับอาจยังใช้งานได้ (ตามดุลยพินิจ)</li>
                      <li>เราอาจลบข้อมูลของคุณตาม Privacy Policy</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 8: General Provisions */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>8. บทบัญญัติทั่วไป</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">8.1 การแก้ไขข้อตกลง:</h3>
                    <p className="text-content-secondary">
                      เราสงวนสิทธิ์ในการแก้ไขข้อตกลงนี้ได้ตลอดเวลา โดยจะแจ้งให้ทราบผ่าน:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-content-secondary mt-2">
                      <li>ประกาศบนแพลตฟอร์ม</li>
                      <li>อีเมล (กรณีเปลี่ยนแปลงสำคัญ)</li>
                    </ul>
                    <p className="text-content-secondary mt-2">
                      การใช้บริการต่อหลังจากมีการแก้ไข ถือว่าคุณยอมรับข้อตกลงฉบับใหม่
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">8.2 กฎหมายที่ใช้บังคับ:</h3>
                    <p className="text-content-secondary">
                      ข้อตกลงนี้อยู่ภายใต้กฎหมายไทย
                      ข้อพิพาทใดๆ จะอยู่ในเขตอำนาจศาลไทยเท่านั้น
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">8.3 การแยกส่วนได้:</h3>
                    <p className="text-content-secondary">
                      หากส่วนใดของข้อตกลงนี้ถูกตัดสินว่าไม่สมบูรณ์หรือบังคับไม่ได้
                      ส่วนอื่นยังคงมีผลบังคับใช้
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">8.4 การสละสิทธิ์:</h3>
                    <p className="text-content-secondary">
                      การที่เราไม่ใช้สิทธิ์ในข้อตกลงนี้ ไม่ถือเป็นการสละสิทธิ์นั้น
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-content-primary mb-2">8.5 ความสมบูรณ์ของข้อตกลง:</h3>
                    <p className="text-content-secondary">
                      ข้อตกลงนี้ถือเป็นข้อตกลงฉบับสมบูรณ์ระหว่างคุณและเรา
                      แทนที่ข้อตกลงก่อนหน้านี้ทั้งหมด
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div variants={fadeIn}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>9. ติดต่อเรา</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-content-secondary">
                    หากมีข้อสงสัยเกี่ยวกับข้อตกลงนี้ กรุณาติดต่อ:
                  </p>

                  <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-content-primary">NextJS Starter</p>
                    <p className="text-sm text-content-tertiary">Phitsanulok, Thailand 65000</p>
                    <div className="pt-2 space-y-1">
                      <p className="text-sm">
                        <strong>อีเมล:</strong>{' '}
                        <a href="mailto:thanatouchth@gmail.com" className="text-interactive-primary hover:opacity-80">
                          thanatouchth@gmail.com
                        </a>
                      </p>
                      <p className="text-sm">
                        <strong>โทรศัพท์:</strong>{' '}
                        <a href="tel:0955904245" className="text-interactive-primary hover:opacity-80">
                          095-590-4245
                        </a>
                      </p>
                      <p className="text-sm text-content-tertiary">
                        (วันจันทร์-ศุกร์ เวลา 09:00-17:00 น.)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Footer */}
            <motion.div variants={fadeIn} className="text-center pt-8 border-t border-border-primary">
              <p className="text-sm text-content-secondary">
                ข้อกำหนดและเงื่อนไขฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่ 26 มกราคม 2568 เป็นต้นไป
              </p>
              <p className="text-xs text-content-tertiary mt-2">
                © 2025 NextJS Starter - Educational & Experimental Use Only
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
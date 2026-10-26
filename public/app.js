const subjects=['Mathematics','English','Science','Computer Science','Social Science'];
const $=id=>document.getElementById(id);
const error=msg=>{if($('error'))$('error').textContent=msg;};
if($('studentForm')) $('studentForm').addEventListener('submit',e=>{
 e.preventDefault();if(!e.target.reportValidity())return;
 const student=Object.fromEntries(['student_name','roll_no','class_name','semester','department'].map(id=>[id,$(id).value.trim()]));
 if(!/^[A-Za-z ]{2,100}$/.test(student.student_name))return error('Name must contain letters and spaces only.');
 if(!/^[A-Za-z0-9-]{1,30}$/.test(student.roll_no))return error('Invalid roll number.');
 if(Object.values(student).some(v=>!v))return error('All fields are required.');
 sessionStorage.setItem('student',JSON.stringify(student));location.href='marks.html';
});
if($('marksForm')){
 if(!sessionStorage.getItem('student'))location.replace('index.html');
 subjects.forEach((subject,i)=>{const div=document.createElement('div');div.className='mark-row';const label=document.createElement('label');label.htmlFor='mark'+i;label.textContent=subject;const input=document.createElement('input');Object.assign(input,{id:'mark'+i,type:'number',min:'0',max:'100',step:'1',required:true,placeholder:'0 - 100'});div.append(label,input);$('subjectFields').append(div);});
 $('marksForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!e.target.reportValidity())return;
 const marks=Object.fromEntries(subjects.map((s,i)=>[s,Number($('mark'+i).value)]));
 if(Object.values(marks).some(n=>!Number.isInteger(n)||n<0||n>100))return error('Marks must be whole numbers from 0 to 100.');
 const button=e.target.querySelector('button[type=submit]');button.disabled=true;error('');
 try{const response=await fetch('/api/marksheets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...JSON.parse(sessionStorage.getItem('student')),marks})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to save');sessionStorage.setItem('lastRoll',JSON.parse(sessionStorage.getItem('student')).roll_no);location.href='result.html';}
 catch(err){error(err.message);button.disabled=false;}
 });
}
if($('searchButton')){
 const show=async roll=>{
  error('');$('report').hidden=true;$('printButton').hidden=true;
  if(!/^[A-Za-z0-9-]{1,30}$/.test(roll))return error('Enter a valid roll number.');
  try{const response=await fetch('/api/marksheets/'+encodeURIComponent(roll));const d=await response.json();if(!response.ok)throw Error(d.error||'Search failed');
   const details=$('details');details.replaceChildren();
   [['Name',d.student_name],['Roll Number',d.roll_no],['Class',d.class_name],['Semester',d.semester],['Department',d.department]].forEach(([k,v])=>{const p=document.createElement('p');const b=document.createElement('strong');b.textContent=k+': ';p.append(b,document.createTextNode(v));details.append(p);});
   const marks=typeof d.marks==='string'?JSON.parse(d.marks):d.marks;$('marksBody').replaceChildren();subjects.forEach(s=>{const tr=document.createElement('tr');[s,String(marks[s]),'100'].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});$('marksBody').append(tr);});
   $('summary').replaceChildren();[['Total',d.total+' / 500'],['Percentage',d.percentage+'%'],['Grade',d.grade],['Result',d.result]].forEach(([k,v])=>{const p=document.createElement('p');const b=document.createElement('strong');b.textContent=k+': ';p.append(b,document.createTextNode(v));$('summary').append(p);});$('report').hidden=false;$('printButton').hidden=false;
  }catch(err){error(err.message);}
 };
 $('searchButton').addEventListener('click',()=>show($('searchRoll').value.trim()));$('printButton').addEventListener('click',()=>window.print());
 const last=sessionStorage.getItem('lastRoll');if(last){$('searchRoll').value=last;sessionStorage.removeItem('lastRoll');show(last);}
}

import { test } from 'node:test';
import assert = require('node:assert/strict');
import { categoryFor } from './news.classifier';

test('classifies real disaster reports', () => {
  assert.equal(categoryFor('Gempa M 7,1 Guncang Maluku Tenggara', ''), 'EARTHQUAKE');
  assert.equal(categoryFor('Gunung Ibu Erupsi Malam Ini, Muntahkan Kolom Abu 500 Meter', ''), 'VOLCANO');
  assert.equal(categoryFor('Banjir Susulan di Aceh Rusak Infrastruktur', ''), 'FLOOD');
  assert.equal(categoryFor('Balita Tewas Tertimbun Longsor di Aceh Tengah', ''), 'LANDSLIDE');
  assert.equal(categoryFor('Status Tanggap Darurat Berakhir Usai 3 Bulan Karhutla', ''), 'WILDFIRE');
  assert.equal(categoryFor('Penampakan Dahsyat Puting Beliung di Lampung', ''), 'WEATHER');
  assert.equal(categoryFor('BNPB Siapkan Modifikasi Cuaca', 'Mitigasi bencana hidrometeorologi'), null);
  assert.equal(categoryFor('Waka DPR Minta Semua Pihak Kaji Wacana Relokasi Badak Jawa', 'mitigasi bencana'), null);
});

test('rejects non-disaster stories that mention "gunung" or plain fire', () => {
  assert.equal(categoryFor('Israel Serang Lebanon, Klaim Incar Senjata Hizbullah', 'serangan ke wilayah pegunungan'), null);
  assert.equal(categoryFor('Tawuran di Bogor Lukai 1 Orang', 'Tujuh orang diamankan di Gunung Putri'), null);
  assert.equal(categoryFor('Menengok Gunung Sampah Bantargebang, Setara Gedung 16 Lantai', ''), null);
  assert.equal(categoryFor('Pembukaan Lahan Pengungsi Sinabung di Siosar Ricuh', ''), null);
  assert.equal(categoryFor('Pendakian Gunung Penanggungan Ditutup Total Usai Remaja Tewas', ''), null);
  assert.equal(categoryFor('Polisi Surabaya Ngamar Bareng Kades Lamongan Dijebloskan ke Patsus', 'gunung'), null);
  assert.equal(categoryFor('Warga Lereng Merapi Diminta Waspada, Status Siaga Diperpanjang', ''), 'VOLCANO');
  assert.equal(categoryFor('Rampok Berpistol Bobol Toko Elektronik di Gunung Sahari', ''), null);
  assert.equal(categoryFor('Kebakaran Rumah di Depok, 3 Mobil Hangus', ''), null);
});

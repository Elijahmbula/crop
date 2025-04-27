import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './layouts/Login'; // Adjust the path as necessary
import Home from './layouts/Home'; // Adjust the path as necessary
import Climate from './layouts/Climate.js'
import FClimate from './layouts/FClimate.js'
import Register from './layouts/Register.js'
import Plant from './layouts/Plant.js'
import {Recommend} from './layouts/Recommend.js'
import {MRecommend} from './layouts/MRecommend.js'
import Bluetooth from './layouts/Bluetooth.js'
import Bluetoot from './layouts/Bluetoot.js'
import Dashboard from './layouts/Dashboard.js'
import CHistory from './layouts/CHistory.js'
import FHistory from './layouts/FHistory.js'
import FBluetooth from './layouts/FBluetooth.js'
import Fertilizer from './layouts/Fertilizer.js'
import MFertilizer from './layouts/MFertilizer.js'
import Account from './layouts/Account.js'
//import FertilizerForm from './layouts/FertilizerForm.js'
import WeatherSoil from './layouts/WeatherSoil.js';
import FertilizerForm from './layouts/FertilizerForm.js';



function App() {
  return (
    <div >
       <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/FClimate" element={<FClimate/>} />
        <Route path="/Climate" element={<Climate/>} />
        <Route path="/plant" element={<Plant/>} />
        <Route path="/Recommend" element={<Recommend/>} />
        <Route path="/MRecommend" element={<MRecommend/>} />
        <Route path="/Bluetooth" element={<Bluetooth/>} />
        
        <Route path="/Bluetoot" element={<Bluetoot/>} />
        

        <Route path="/Dashboard" element={<Dashboard/>} />
        <Route path="/CHistory" element={<CHistory/>} />
        <Route path="/FHistory" element={<FHistory/>} />
        <Route path="/FBluetooth" element={<FBluetooth/>} />
        <Route path="/Fertilizer" element={<Fertilizer/>} />
        <Route path="/MFertilizer" element={<MFertilizer/>} />
        <Route path="/Account" element={<Account/>} />
        <Route path="/WeatherSoil" element={<WeatherSoil/>} />
        <Route path="/FertilizerForm" element={<FertilizerForm/>} />
      </Routes>
    </Router>
  
    </div>
  );
}

export default App;

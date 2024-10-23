import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message } from 'antd'; // Import message from antd for displaying notifications
import { ReloadOutlined } from '@ant-design/icons';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import { useParams } from 'react-router-dom';
import "./BidTable.css";
import api from '../../config/axios';
let stompClient = null;

const BidTable = ({ initialPrice ,isAuctionEnded}) => {
  const { roomId } = useParams();
  const [bidderId, setBidderId] = useState('');
  const [bidTable, setBidTable] = useState([]);
  const [pastBids, setPastBids] = useState([]);
  const [bidData, setBidData] = useState({
    connected: false,
    price: ''
  });

  const [inputError, setInputError] = useState(''); // State to handle input error
  useEffect(() => {
    fetchPastBids();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser); // Parse the JSON string
      setBidderId(userData.bidder.id); // Access bidder.id
    }

    connect();
  }, []);

  const connect = () => {
    let Sock = new SockJS('http://localhost:8080/BidKoi/ws');
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setBidData({ ...bidData, connected: true });
    stompClient.subscribe(`/bid/${roomId}`, onMessageReceived);
  }
  const fetchPastBids = async () => {
    try {
      // Gửi yêu cầu tới API để lấy past bids
      const response = await api.get(`/placeBid/${roomId}`);
      const data = response.data;
      console.log(data);
      // Cập nhật danh sách past bids
      setPastBids(data);
    } catch (error) {
      console.error('Error fetching past bids:', error);
    }
  };
  const onMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":

        break;
      case "MESSAGE":
        setBidTable((prevBids) => [...prevBids, payloadData]);
        setPastBids((prevBids) => [...prevBids, payloadData]);
        break;
      default:
        break;
    }
  };

  const handleBidAmount = (event) => {
    const { value } = event.target;
    setBidData({ ...bidData, price: value });

    // Validate if the entered price is greater than the minimum bid
    if (parseFloat(value) < parseFloat(minimumBid)) {
      setInputError(`Bid must be higher than Minimum bid: ${minimumBid}`);
    } else {
      setInputError(''); // Clear error if the input is valid
    }
  };

  const sendBid = () => {
    if (parseFloat(bidData.price) < parseFloat(minimumBid)) {
      message.error(`Your bid must be higher than Minimum bid: ${minimumBid}`);
      return;
    }

    if (stompClient && bidData.price && bidderId) {
      const bidMessage = {
        userId: bidderId,
        price: bidData.price,
        status: "MESSAGE"
      };
      stompClient.send(`/app/bid/${roomId}`, {}, JSON.stringify(bidMessage));
      setBidData({ ...bidData, price: "" });
    }
  };

  const onError = (err) => {
    console.error("Connection error", err);
  };

  const handleRefresh = () => {
    fetchPastBids();
  };

  // Tính giá cao nhất từ các bids
  const highestBid = pastBids.length === 0
    ? initialPrice
    : Math.max(initialPrice, Math.max(...pastBids.map(bid => parseFloat(bid.price))));
  // Tính Increments và Minimum Bid
  const increments = (highestBid * 0.05).toFixed(0);
  const minimumBid = (parseFloat(highestBid) + parseFloat(increments)).toFixed(0); // Giá cao nhất + Increments

  return (
    <>
      <Card
        title={<span style={{ fontSize: '30px' }}>Auction</span>}
        className="custom-card"
      >
        <div className="BidInput">
          <Input
            placeholder={`Enter bid amount (Minimum bid: ${minimumBid})`}
            value={bidData.price}
            onChange={handleBidAmount}
            style={{
              borderRadius: '24px',
              padding: '15px 15px',
              width: '60%',
            }}
            disabled={isAuctionEnded}  // Vô hiệu hóa input khi đấu giá kết thúc
          />
          <Button
            type="primary"
            shape="round"
            style={{
              borderRadius: '24px',
              padding: '15px 15px',
              margin: '5px',
              width: '30%',
            }}
            onClick={sendBid}
            disabled={isAuctionEnded || parseFloat(bidData.price) < parseFloat(minimumBid)} // Vô hiệu hóa khi đấu giá kết thúc hoặc giá bid không hợp lệ
          >
            Place Bid
          </Button>
        </div>
        {inputError && (
          <p style={{ color: 'red', marginTop: '10px' }}>{inputError}</p>
        )}
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          (Minimum bid: {minimumBid}, Increments of {increments} only)
        </p>
        <Button
          style={{
            marginTop: '20px',
            width: '100%',
            backgroundColor: '#595959',
            color: 'white',
            borderRadius: '20px',
          }}
          disabled={isAuctionEnded} // Vô hiệu hóa nút khi đấu giá kết thúc
        >
          Current Bid: {highestBid > 0 ? highestBid : "No Bids Yet"}
        </Button>
      </Card>

      <Card
        title="Past Bids"
        extra={
          <Button type="default" shape="round" icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
        }
        className="customCard"
      >
        <div className="Bids">
          {pastBids.filter(bid => bid.price > 0).length === 0 ? (
            <>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>No Bids Yet</p>
              <p style={{ color: '#777' }}>Be the first to bid!</p>
            </>
          ) : (
            pastBids
              .filter(bid => bid.price > 0) // Lọc bỏ các bid có price bằng 0
              .sort((a, b) => b.price - a.price) // Sắp xếp theo giá từ cao đến thấp
              .slice(0, 5) // Lấy 5 bid đầu tiên
              .map((bid, index) => (
                <div key={index} className="bidEntry">
                  <p style={{ fontWeight: 'bold' }}>{bid.username}</p>
                  <p>{bid.price}</p>
                  <p>{new Date(bid.date).toLocaleString()}</p> {/* Hiển thị thời gian ở định dạng dễ đọc */}
                </div>
              ))
          )}
        </div>

      </Card>
    </>
  );
};

export default BidTable;

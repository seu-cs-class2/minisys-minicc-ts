.data
.text
delay:			# vars = 1, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -8
	sw	$a0, 8($sp)
	lw	$t0, 8($sp)
	sw	$t0, 4($sp)
_label_4_loop:
	addiu	$t0, $zero, 0
	lw	$t1, 4($sp)
	slt	$t2, $t0, $t1
	beq	$t2, $zero, _label_5_break
	nop
	addiu	$t0, $zero, 1
	lw	$t1, 4($sp)
	sub	$t2, $t1, $t0
	sw	$t2, 4($sp)
	j	_label_4_loop
	nop
_label_5_break:
	addiu	$sp, $sp, 8
	jr	$ra
	nop
main:			# vars = 2, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -32
	sw	$ra, 28($sp)
	addiu	$t0, $zero, 5
	addiu	$t1, $zero, 5
	addiu	$t2, $zero, 0
	addiu	$t3, $zero, 0
	sw	$t1, 20($sp)
	sw	$t3, 24($sp)
_label_8_loop:
	addiu	$t0, $zero, 0
	lw	$t1, 20($sp)
	slt	$t2, $t0, $t1
	beq	$t2, $zero, _label_9_break
	nop
	lw	$t0, 24($sp)
	lw	$t1, 20($sp)
	add	$t2, $t0, $t1
	addiu	$t3, $zero, 1
	sub	$t4, $t1, $t3
	addiu	$t5, $zero, 1000
	sw	$t4, 20($sp)
	sw	$t2, 24($sp)
	move	$a0, $t5
	jal	delay
	nop
	j	_label_8_loop
	nop
_label_9_break:
	lw	$v0, 24($sp)
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
	nop